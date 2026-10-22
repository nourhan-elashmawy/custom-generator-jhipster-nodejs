import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'node-server';
const SUB_GENERATOR_NAMESPACE = `jhipster-nodejs:${SUB_GENERATOR}`;

describe('SubGenerator node-server of nodejs JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig()
        .withOptions({
          ignoreNeedlesError: true,
          blueprint: ['nodejs'],
        })
        .withJHipsterLookup()
        .withParentBlueprintLookup();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
  describe('without client', () => {
    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig({
          skipClient: true,
        })
        .withOptions({
          ignoreNeedlesError: true,
          blueprint: ['nodejs'],
        })
        .withJHipsterLookup()
        .withParentBlueprintLookup();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });

    it('README should match snapshot', () => {
      expect(result.getSnapshot('**/README.md')).toMatchSnapshot();
    });
  });
  describe('regenerating entities whose needle entries were reformatted by prettier', () => {
    // Prettier splits long entries over several lines and adds trailing commas, so the single-line
    // contentToAdd no longer matches them. Re-running the same JDL must still leave these files untouched.
    const seededFiles = {
      'server/src/web/errors/error-codes.ts': `export const ERROR_CODES = {
  ADMINISTRATIVE_REGION_NOT_FOUND: {
    code: 'administrativeRegion.notFound',
    status: HttpStatus.NOT_FOUND,
    message: 'AdministrativeRegion not found.',
  },
  // jhipster-needle-add-entity-error-code - JHipster will add entity error codes here, do not remove
};
`,
      'server/src/app.module.ts': `import {
  AdministrativeRegionModule,
} from './module/administrative-region.module';
// jhipster-needle-add-entity-module-to-main-import - JHipster will import entity modules here, do not remove

@Module({
  imports: [
    AdministrativeRegionModule,
    // jhipster-needle-add-entity-module-to-main - JHipster will add entity modules here, do not remove
  ],
})
export class AppModule {}
`,
      'server/src/orm.config.ts': `import { User } from './domain/user.entity';
import { Authority } from './domain/authority.entity';
import {
  AdministrativeRegion,
} from './domain/administrative-region.entity';
// jhipster-needle-add-entity-to-ormconfig-imports - JHipster will add code here, do not remove

const commonConf = {
  ENTITIES: [
    User,
    Authority,
    AdministrativeRegion,
    // jhipster-needle-add-entity-to-ormconfig-entities - JHipster will add code here, do not remove
  ],
};
`,
    };

    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig({}, [{ name: 'AdministrativeRegion', fields: [{ fieldName: 'name', fieldType: 'String' }] }])
        .withFiles(seededFiles)
        .withOptions({
          // Mirrors `jhipster entities`/`jhipster jdl` on an existing app: only entity priorities write.
          skipPriorities: ['writing', 'postWriting'],
          blueprint: ['nodejs'],
        })
        .withJHipsterLookup()
        .withParentBlueprintLookup();
    });

    for (const [file, content] of Object.entries(seededFiles)) {
      it(`should leave ${file} unchanged`, () => {
        expect(result.getSnapshot(`**/${file}`)[file]?.contents).toBe(content);
      });
    }
  });
  describe('generating an entity whose name is a suffix of an existing one', () => {
    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig({}, [{ name: 'Zone', fields: [{ fieldName: 'name', fieldType: 'String' }] }])
        .withFiles({
          'server/src/web/errors/error-codes.ts': `export const ERROR_CODES = {
  ADMINISTRATIVE_ZONE_NOT_FOUND: { code: 'administrativeZone.notFound', status: HttpStatus.NOT_FOUND, message: 'Zone not found.' },
  // jhipster-needle-add-entity-error-code - JHipster will add entity error codes here, do not remove
};
`,
          'server/src/app.module.ts': `import { AdministrativeZoneModule } from './module/administrative-zone.module';
// jhipster-needle-add-entity-module-to-main-import - JHipster will import entity modules here, do not remove

@Module({
  imports: [
    AdministrativeZoneModule,
    // jhipster-needle-add-entity-module-to-main - JHipster will add entity modules here, do not remove
  ],
})
export class AppModule {}
`,
          'server/src/orm.config.ts': `import { AdministrativeZone } from './domain/administrative-zone.entity';
// jhipster-needle-add-entity-to-ormconfig-imports - JHipster will add code here, do not remove

const commonConf = {
  ENTITIES: [
    AdministrativeZone,
    // jhipster-needle-add-entity-to-ormconfig-entities - JHipster will add code here, do not remove
  ],
};
`,
        })
        .withOptions({
          skipPriorities: ['writing', 'postWriting'],
          blueprint: ['nodejs'],
        })
        .withJHipsterLookup()
        .withParentBlueprintLookup();
    });

    it('should add the entity error code', () => {
      result.assertFileContent('server/src/web/errors/error-codes.ts', /^\s*ZONE_NOT_FOUND:/m);
    });

    it('should add the entity module to app.module imports', () => {
      result.assertFileContent('server/src/app.module.ts', /^\s*ZoneModule,$/m);
    });

    it('should add the entity to orm.config entities', () => {
      result.assertFileContent('server/src/orm.config.ts', /^\s*Zone,$/m);
    });
  });
  describe('regenerating an entity removed from the lists but whose wrapped import remains', () => {
    // A wrapped import puts the bare name on its own line, which must not count as a list entry.
    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig({}, [{ name: 'Zone', fields: [{ fieldName: 'name', fieldType: 'String' }] }])
        .withFiles({
          'server/src/web/errors/error-codes.ts': `export const ERROR_CODES = {
  ZONE_NOT_FOUND: { code: 'zone.notFound', status: HttpStatus.NOT_FOUND, message: 'Zone not found.' },
  // jhipster-needle-add-entity-error-code - JHipster will add entity error codes here, do not remove
};
`,
          'server/src/app.module.ts': `import {
  ZoneModule,
} from './module/zone.module';
// jhipster-needle-add-entity-module-to-main-import - JHipster will import entity modules here, do not remove

@Module({
  imports: [
    // jhipster-needle-add-entity-module-to-main - JHipster will add entity modules here, do not remove
  ],
})
export class AppModule {}
`,
          'server/src/orm.config.ts': `import {
  Zone,
} from './domain/zone.entity';
// jhipster-needle-add-entity-to-ormconfig-imports - JHipster will add code here, do not remove

const commonConf = {
  ENTITIES: [
    // jhipster-needle-add-entity-to-ormconfig-entities - JHipster will add code here, do not remove
  ],
};
`,
        })
        .withOptions({
          skipPriorities: ['writing', 'postWriting'],
          blueprint: ['nodejs'],
        })
        .withJHipsterLookup()
        .withParentBlueprintLookup();
    });

    it('should re-add the entity module to app.module imports without duplicating the import', () => {
      result.assertFileContent('server/src/app.module.ts', /^ {4}ZoneModule,\n {4}\/\/ jhipster-needle-add-entity-module-to-main /m);
      result.assertNoFileContent('server/src/app.module.ts', /import \{ ZoneModule \}/);
    });

    it('should re-add the entity to orm.config entities without duplicating the import', () => {
      result.assertFileContent('server/src/orm.config.ts', /^ {4}Zone,\n {4}\/\/ jhipster-needle-add-entity-to-ormconfig-entities /m);
      result.assertNoFileContent('server/src/orm.config.ts', /import \{ Zone \}/);
    });
  });
});
