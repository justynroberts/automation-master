const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SandboxEngine {
    constructor() {
        this.tempDir = '/tmp/workflow-sandbox';
        this.activeContainers = new Set(); // Track active Docker containers
        this.ensureTempDir();
        
        // Cleanup on process exit
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.warn('Could not create temp directory:', error.message);
        }
    }

    async executeInSandbox(nodeType, code, context = {}, timeout = 30000) {
        const executionId = crypto.randomUUID();
        const workDir = path.join(this.tempDir, executionId);
        
        try {
            // Create isolated work directory
            await fs.mkdir(workDir, { recursive: true });
            
            switch (nodeType) {
                case 'javascript':
                    return await this.executeJavaScript(code, context, workDir, timeout);
                case 'python':
                    return await this.executePython(code, context, workDir, timeout);
                case 'bash':
                    return await this.executeBash(code, context, workDir, timeout);
                default:
                    throw new Error(`Unsupported sandbox execution type: ${nodeType}`);
            }
        } finally {
            // Cleanup
            try {
                await fs.rm(workDir, { recursive: true, force: true });
            } catch (error) {
                console.warn('Cleanup failed:', error.message);
            }
        }
    }

    async executeJavaScript(code, context, workDir, timeout) {
        // Create safe execution script
        const scriptContent = `
const vm = require('vm');
const util = require('util');

// Create sandbox context
const sandbox = {
    console: {
        log: (...args) => process.stdout.write(util.format(...args) + '\\n'),
        error: (...args) => process.stderr.write(util.format(...args) + '\\n')
    },
    context: ${JSON.stringify(context)},
    result: null,
    setTimeout: (fn, delay) => { throw new Error('setTimeout not allowed'); },
    setInterval: (fn, delay) => { throw new Error('setInterval not allowed'); },
    require: () => { throw new Error('require not allowed'); },
    process: undefined,
    global: undefined,
    Buffer: undefined
};

// Inject the code
const userCode = ${JSON.stringify(code)};

// Debug: Show first 200 chars of user code
console.error('DEBUG: User code preview:', userCode.substring(0, 200).replace(/\\n/g, '\\\\n'));

// Create and run the script
let codeToRun;
try {
    // Ensure user code ends with a newline to prevent syntax errors
    codeToRun = userCode + '\\n' + \`
        // Call the executeNode function if it exists
        if (typeof executeNode === 'function') {
            Promise.resolve(executeNode(context.inputs || {}, context, context.inputs || {}))
                .then(res => {
                    console.log('RESULT:', JSON.stringify(res));
                })
                .catch(err => {
                    console.error('ERROR:', err.message);
                    process.exit(1);
                });
        } else {
            console.error('ERROR: executeNode function not found');
            process.exit(1);
        }
    \`;
    
    const script = new vm.Script(codeToRun);
    const vmContext = vm.createContext(sandbox);
    script.runInContext(vmContext, { timeout: ${Math.min(timeout, 10000)} });
} catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
    if (codeToRun) {
        console.error('Code preview:', codeToRun.substring(0, 500));
    }
    process.exit(1);
}
`;

        const scriptPath = path.join(workDir, 'script.js');
        await fs.writeFile(scriptPath, scriptContent);

        return await this.runDockerContainer('workflow-executor:latest', [
            'node', '/workspace/script.js'
        ], workDir, timeout);
    }

    async executePython(code, context, workDir, timeout) {
        const scriptContent = `
import json
import sys
import os

# Restricted imports
import builtins
original_import = builtins.__import__

def restricted_import(name, *args, **kwargs):
    allowed_modules = ['json', 'math', 'datetime', 're', 'random']
    if name not in allowed_modules:
        raise ImportError(f"Module '{name}' is not allowed")
    return original_import(name, *args, **kwargs)

builtins.__import__ = restricted_import

# Provide context
context = ${JSON.stringify(context).replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None')}

try:
    # Execute user code
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

        const scriptPath = path.join(workDir, 'script.py');
        await fs.writeFile(scriptPath, scriptContent);

        return await this.runDockerContainer('workflow-executor:latest', [
            'python3', '/workspace/script.py'
        ], workDir, timeout);
    }

    async executeBash(command, context, workDir, timeout) {
        // SECURITY FIX: Validate and sanitize bash command
        if (!command || typeof command !== 'string') {
            throw new Error('Invalid bash command');
        }

        // Check for dangerous commands and patterns
        const dangerousPatterns = [
            /rm\s+-rf?\s+\//, // rm -rf /
            />\s*\/dev\//, // writing to device files
            /curl\s+.*\|\s*bash/, // curl pipe to bash
            /wget\s+.*\|\s*bash/, // wget pipe to bash
            /nc\s+/, // netcat
            /exec\s+/, // exec commands
            /eval\s+/, // eval
            /\$\([^)]*\)/, // command substitution
            /`[^`]*`/, // backticks
            /chmod\s+.*\+s/, // setuid
            /sudo/, // sudo commands
            /su\s/, // switch user
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
                throw new Error(`Command contains dangerous pattern: ${pattern}`);
            }
        }

        // Escape command properly
        const escapedCommand = command.replace(/'/g, "'\"'\"'");
        
        // Create restricted bash script
        const scriptContent = `#!/bin/bash
set -e
cd /workspace

# Restricted environment
unset HOSTNAME
export PATH="/usr/local/bin:/usr/bin:/bin"

# Execute command with timeout
timeout ${Math.floor(timeout / 1000)} bash -c '${escapedCommand}'
`;

        const scriptPath = path.join(workDir, 'script.sh');
        await fs.writeFile(scriptPath, scriptContent);
        await fs.chmod(scriptPath, 0o755);

        return await this.runDockerContainer('workflow-executor:latest', [
            '/workspace/script.sh'
        ], workDir, timeout);
    }

    async runDockerContainer(image, command, workDir, timeout) {
        const containerId = crypto.randomUUID();
        
        // SECURITY FIX: Validate Docker parameters
        if (!Array.isArray(command) || command.some(arg => typeof arg !== 'string')) {
            throw new Error('Invalid Docker command arguments');
        }

        // Validate image name
        if (!/^[a-zA-Z0-9:._-]+$/.test(image)) {
            throw new Error('Invalid Docker image name');
        }

        // Validate workDir path
        if (!workDir.startsWith(this.tempDir)) {
            throw new Error('Invalid work directory path');
        }
        
        return new Promise((resolve, reject) => {
            const docker = spawn('docker', [
                'run',
                '--rm',
                '--name', `workflow-${containerId}`,
                '--read-only',
                '--tmpfs', '/tmp:rw,noexec,nosuid,size=50m',
                '--network', 'none',
                '--memory', '64m',
                '--memory-swap', '64m',
                '--cpu-quota', '25000', // Reduced CPU usage
                '--cpu-period', '100000',
                '--pids-limit', '25', // Reduced process limit
                '--ulimit', 'nproc=25:25',
                '--ulimit', 'nofile=50:50',
                '--cap-drop', 'ALL',
                '--security-opt', 'no-new-privileges',
                '--user', 'nobody:nobody',
                '-v', `${workDir}:/workspace:ro`,
                '-w', '/workspace',
                image,
                ...command
            ], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Track this container
            this.activeContainers.add(containerId);

            let stdout = '';
            let stderr = '';

            docker.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            docker.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            const timeoutId = setTimeout(() => {
                docker.kill('SIGKILL');
                reject(new Error(`Execution timed out after ${timeout}ms`));
            }, timeout);

            docker.on('close', (code) => {
                clearTimeout(timeoutId);
                this.activeContainers.delete(containerId);
                
                if (code === 0) {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode: code,
                        sandboxed: true
                    });
                } else {
                    reject(new Error(`Process exited with code ${code}: ${stderr}`));
                }
            });

            docker.on('error', (error) => {
                clearTimeout(timeoutId);
                this.activeContainers.delete(containerId);
                reject(new Error(`Docker execution failed: ${error.message}`));
            });
        });
    }

    async checkDockerAvailable() {
        return new Promise((resolve) => {
            console.log('🐳 Checking Docker availability...');
            const docker = spawn('docker', ['ps'], { stdio: 'pipe' });
            docker.on('close', (code) => {
                console.log(`🐳 Docker check exit code: ${code}`);
                resolve(code === 0);
            });
            docker.on('error', (err) => {
                console.log(`🐳 Docker check error: ${err.message}`);
                resolve(false);
            });
        });
    }

    async cleanup() {
        console.log('🧹 Cleaning up sandbox engine...');
        
        // Kill any remaining containers
        for (const containerId of this.activeContainers) {
            try {
                spawn('docker', ['kill', `workflow-${containerId}`], { stdio: 'ignore' });
            } catch (error) {
                console.warn(`Failed to kill container workflow-${containerId}:`, error.message);
            }
        }
        
        // Clean up temp directory
        try {
            await fs.rm(this.tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn('Failed to clean temp directory:', error.message);
        }
        
        console.log('✅ Sandbox cleanup completed');
    }

    getStats() {
        return {
            activeContainers: this.activeContainers.size,
            tempDir: this.tempDir
        };
    }
}

module.exports = SandboxEngine;