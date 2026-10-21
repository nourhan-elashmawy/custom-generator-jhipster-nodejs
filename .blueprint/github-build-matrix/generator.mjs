import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import BaseGenerator from 'generator-jhipster/generators/base';
import {
  convertToGitHubMatrix,
  getGithubOutputFile,
  getGithubSamplesGroup,
  getUnknownGitHubMatrixGroupProperties,
  setGithubTaskOutput,
} from 'generator-jhipster/testing';

/**
 * generator-jhipster's getGithubSamplesGroup imports `.js` groups from a bare filesystem path, which Node rejects on
 * Windows (`Received protocol 'd:'`). Load those through a file URL instead and delegate every other group type.
 */
const loadSamplesGroup = async (samplesFolder, group) => {
  const jsGroupFile = join(samplesFolder, `${group}.js`);
  if (!existsSync(jsGroupFile)) {
    return getGithubSamplesGroup(samplesFolder, group);
  }
  const { default: jsGroup } = await import(pathToFileURL(jsGroupFile).href);
  const samples = Object.fromEntries(Object.entries(jsGroup).map(([sample, value]) => [sample, { ...value, 'samples-group': group }]));
  const unknownProperties = getUnknownGitHubMatrixGroupProperties(samples);
  const warnings = unknownProperties.length ? [`Unknown properties in ${group}: ${unknownProperties.join(', ')}`] : [];
  return { samples, warnings };
};

export default class extends BaseGenerator {
  /** @type {string} */
  samplesFolder;
  /** @type {string} */
  samplesGroup;
  /** @type {object} */
  matrix;

  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true, jhipsterBootstrap: false });
  }

  get [BaseGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async buildMatrix() {
        const { samplesGroup = 'samples' } = this;
        const templatePath = this.templatePath('../../generate-sample/templates/');
        const samplesFolder = this.samplesFolder ? join(templatePath, this.samplesFolder) : templatePath;
        const { samples, warnings } = await loadSamplesGroup(samplesFolder, samplesGroup);
        if (warnings.length > 0) {
          this.log.info(warnings.join('\n'));
        }
        this.matrix = convertToGitHubMatrix(samples);
        const githubOutputFile = getGithubOutputFile();
        this.log.info('matrix', this.matrix);
        if (githubOutputFile) {
          setGithubTaskOutput('matrix', JSON.stringify(this.matrix));
        }
      },
    });
  }
}
