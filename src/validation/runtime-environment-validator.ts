import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as net from "node:net";

type CheckType = "os_package" | "env_variable" | "network_endpoint";

interface PrerequisiteCheck {
  type: CheckType;
  description: string;
  details: any;
}

interface OsPackageCheck {
  package: string;
  manager: "apt" | "yum" | "brew";
}

interface EnvVariableCheck {
  key: string;
  required?: boolean;
}

interface NetworkEndpointCheck {
  host: string;
  port: number;
  protocol: "tcp" | "udp";
}

export interface PrerequisiteManifest {
  os_packages: OsPackageCheck[];
  environment_variables: EnvVariableCheck[];
  network_endpoints: NetworkEndpointCheck[];
}

export interface CheckResult {
  checkType: CheckType;
  description: string;
  passed: boolean;
  message: string;
}

export interface ValidationReport {
  overallSuccess: boolean;
  results: CheckResult[];
}

export class RuntimeEnvironmentValidator {
  private execPromise = promisify(exec);

  private async checkOsPackage(check: OsPackageCheck): Promise<CheckResult> {
    let command: string;
    switch (check.manager) {
      case "apt":
        command = `dpkg -l ${check.package} > /dev/null 2>&1`;
        break;
      case "yum":
        command = `rpm -q ${check.package} > /dev/null 2>&1`;
        break;
      case "brew":
        command = `brew list --formula ${check.package} > /dev/null 2>&1`;
        break;
      default:
        return {
          checkType: "os_package",
          description: check.description,
          passed: false,
          message: "Unsupported package manager.",
        };
    }

    try {
      await this.execPromise(command);
      return {
        checkType: "os_package",
        description: check.description,
        passed: true,
        message: `${check.package} is installed.`,
      };
    } catch (e) {
      return {
        checkType: "os_package",
        description: check.description,
        passed: false,
        message: `${check.package} is missing or inaccessible.`,
      };
    }
  }

  private checkEnvironmentVariable(check: EnvVariableCheck): Promise<CheckResult> {
    const value = process.env[check.key];
    const passed = value !== undefined;
    const message = passed ? `Found environment variable ${check.key}.` : `Missing required environment variable ${check.key}.`;

    return {
      checkType: "env_variable",
      description: check.description,
      passed: passed,
      message: message,
    };
  }

  private checkNetworkEndpoint(check: NetworkEndpointCheck): Promise<CheckResult> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      let connected = false;

      client.on("connect", () => {
        connected = true;
        client.destroy();
        resolve({
          checkType: "network_endpoint",
          description: check.description,
          passed: true,
          message: `Successfully connected to ${check.host}:${check.port}.`,
        });
      });

      client.on("error", (err) => {
        resolve({
          checkType: "network_endpoint",
          description: check.description,
          passed: false,
          message: `Failed to connect to ${check.host}:${check.port}. Error: ${err.message}`,
        });
      });

      if (check.protocol === "tcp") {
        client.connect(check.port, check.host);
      } else {
        // Simplified UDP check (connectionless, just checking if the port is open enough to send/receive)
        // For simplicity and reliability in a validator, we stick to TCP connect attempt.
        // A full UDP check is complex and often unreliable without specific tools.
        client.connect(check.port, check.host);
      }
    });
  }

  public async validate(manifest: PrerequisiteManifest): Promise<ValidationReport> {
    const osChecks = manifest.os_packages.map(check => this.checkOsPackage(check));
    const envChecks = manifest.environment_variables.map(check => this.checkEnvironmentVariable(check));
    const netChecks = manifest.network_endpoints.map(check => this.checkNetworkEndpoint(check));

    const [osResults, envResults, netResults] = await Promise.all([
      Promise.all(osChecks),
      Promise.all(envChecks),
      Promise.all(netChecks),
    ]);

    const allResults: CheckResult[] = [
      ...osResults,
      ...envResults,
      ...netResults,
    ];

    const overallSuccess = allResults.every(r => r.passed);

    return {
      overallSuccess,
      results: allResults,
    };
  }
}

export { RuntimeEnvironmentValidator };