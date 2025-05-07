import checkbox from '@inquirer/checkbox';
import chalk from 'chalk';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';
import type { Ora } from 'ora';

// Types
interface PackageJson {
  scripts?: Record<string, string>;
}

interface Script {
  value: string;
  name: string;
  description: string;
  checked?: boolean;
  args?: string;
  emoji?: string;
  useRawOutput?: boolean; // New flag for scripts that need raw output
}

type AllowedScripts = readonly Script[];

// Configuration with emojis
const allowedScripts: AllowedScripts = [
  {
    value: 'format:check',
    name: 'Prettier',
    description: 'Opinionated code formatter',
    emoji: '✨',
  },
  {
    value: 'lint',
    name: 'ESLint',
    description: 'Statically analyzes your code to find problems',
    emoji: '🔍',
  },
  {
    value: 'typecheck',
    name: 'Typescript',
    description: 'Run compiler by checking your code',
    emoji: '📝',
  },
  {
    value: 'build',
    name: 'Build',
    description: 'Build application and server',
    emoji: '📦',
  },
  {
    value: 'test:unit',
    name: 'Vitest',
    description: 'Run next generation unit testing framework',
    args: 'run',
    emoji: '🧪',
  },
  {
    value: 'test:e2e',
    name: 'Playwright',
    description: 'Run reliable end-to-end testing for modern web apps',
    args: '--quiet',
    emoji: '🎭',
  },
];

class ScriptRunner {
  private currentProcess: ReturnType<typeof spawn> | null = null;
  private spinner: Ora;

  constructor() {
    this.spinner = ora();
    this.setupProcessHandlers();
  }

  private setupProcessHandlers(): void {
    const shutdown = () => {
      console.log(chalk.yellow('\n👋 Gracefully shutting down...'));
      if (this.currentProcess) {
        console.log(chalk.yellow('🛑 Terminating running scripts...'));
        this.currentProcess.kill('SIGTERM');
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  private async validatePackageJson(): Promise<PackageJson> {
    const packagePath = path.resolve(process.cwd(), 'package.json');

    try {
      const content = await fs.readFile(packagePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`❌ Failed to read package.json: ${error.message}`);
      }
      throw error;
    }
  }

  private async getScriptList(): Promise<Script[]> {
    const packageJson = await this.validatePackageJson();
    const scripts = Object.keys(packageJson.scripts ?? {});

    const missingScripts = allowedScripts.filter(({ value }) => !scripts.includes(value));

    if (missingScripts.length > 0) {
      throw new Error(`❌ Missing scripts in package.json: ${missingScripts.map(({ value }) => value).join(', ')}`);
    }

    return allowedScripts.filter(({ value }) => scripts.includes(value));
  }

  private async execScript(script: Script): Promise<void> {
    const command = `npm run ${script.value}${script.args ? ` -- ${script.args}` : ''}`;

    return await new Promise((resolve, reject) => {
      this.spinner.start(`${script.emoji} Running ${script.name}...`);

      this.currentProcess = spawn(command, [], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      });

      let output = '';

      this.currentProcess.stdout?.on('data', (data) => {
        output += data;
        this.spinner.text = `${script.emoji} Running ${script.name}... ${data.toString().trim()}`;
      });

      this.currentProcess.stderr?.on('data', (data) => {
        output += data;
        this.spinner.text = `${script.emoji} Running ${script.name}... ${chalk.yellow(data.toString().trim())}`;
      });

      this.currentProcess.on('close', (code) => {
        this.currentProcess = null;
        if (code === 0) {
          this.spinner.succeed(`${script.emoji} ${script.name} completed successfully`);
          resolve();
        } else {
          this.spinner.fail(`${script.emoji} ${script.name} failed with code ${code}`);
          console.error(output);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      this.currentProcess.on('error', (error) => {
        this.currentProcess = null;
        this.spinner.fail(`${script.emoji} Failed to execute ${script.name}`);
        reject(error);
      });
    });
  }

  public async run(): Promise<void> {
    console.log(chalk.green.bold('🚀 Welcome to the Script Runner!\n'));
    console.log(chalk.magenta('📋 Select scripts to run. They will be executed in the order selected.\n'));

    try {
      const scriptList = await this.getScriptList();

      if (scriptList.length === 0) {
        console.log(chalk.yellow('⚠️ No scripts found in package.json.'));
        return;
      }

      const selected = await checkbox({
        message: 'Select the scripts to run:',
        choices: scriptList.map((script) => ({
          value: script.value,
          name: `${script.emoji} ${script.name}`,
          description: script.description,
          checked: script.checked,
        })),
        loop: false,
        required: true,
        pageSize: 10,
      });

      const selectedScripts = scriptList.filter((script) => selected.includes(script.value));

      for (const script of selectedScripts) {
        await this.execScript(script);
      }

      console.log(chalk.green('\n✨ All selected scripts completed successfully! 🎉'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('\n❌ Error:', error.message));
      }
      process.exit(1);
    }
  }
}

const runner = new ScriptRunner();
await runner.run();
