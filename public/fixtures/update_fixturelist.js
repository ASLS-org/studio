/**
 * This module should be used in order to regenerate fixture list
 * When it has been modified (Add/remove fixture and/or manufacturer)
 *
 */

import fs from 'fs';

/**
 * Fetch manufacturer list
 *
 * @function getManufacturers
 * @async
 * @return {*}
 */
async function getManufacturers() {
  const files = await fs.promises.readdir(__dirname);
  return files.flatMap((file) => (fs.statSync(`${__dirname}/${file}`).isDirectory() ? {
    name: file,
    fixtures: [],
  } : []));
}

/**
 * Fetch manufacturer fixtures
 *
 * @function getManufacturers
 * @async
 * @param {String} manufacturer manufacturer unique name string
 */
async function getManufacturerFixtures(manufacturer) {
  const files = await fs.promises.readdir(`${__dirname}/${manufacturer.name}`);
  manufacturer.fixtures = files || [];
}

/**
 * Create fixture list
 *
 * @function getFixtureList
 * @async
 * @param {String} manufacturer manufacturer unique name string
 */
async function getFixtureList() {
  try {
    const manufacturers = await getManufacturers();
    await Promise.all(
      manufacturers.map(
        async (manufacturer) => getManufacturerFixtures(manufacturer),
      ),
    );
    await fs.promises.writeFile(`${__dirname}/fixture_list.json`, JSON.stringify(manufacturers), 'utf8');
  } catch (err) {
    process.stderr(err);
  }
}

getFixtureList();
