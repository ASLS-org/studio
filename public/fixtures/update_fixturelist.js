'use strict'

/**
 * This module should be used in order to regenerate fixture list
 * When it has been modified (Add/remove fixture and/or manufacturer)
 * 
 */


const fs = require('fs');
// const path = require('path');

/**
 * Fetch manufacturer list
 * 
 * @function getManufacturers
 * @async
 * @return {*} 
 */
async function getManufacturers(){
  let files = await fs.promises.readdir(__dirname);
  return files.flatMap(file=>{
    return fs.statSync(`${__dirname}/${file}`).isDirectory() ? {
      name: file,
      fixtures: []
    } : []
  });
}

/**
 * Fetch manufacturer fixtures
 * 
 * @function getManufacturers
 * @async
 * @param {String} manufacturer manufacturer unique name string
 */
async function getManufacturerFixtures(manufacturer){
  let files = await fs.promises.readdir(`${__dirname}/${manufacturer.name}`);
  manufacturer.fixtures = files || []
}

/**
 * Create fixture list
 * 
 * @function getFixtureList
 * @async
 * @param {String} manufacturer manufacturer unique name string
 */
async function getFixtureList(){
  try{
    let manufacturers = await getManufacturers();
    await Promise.all(manufacturers.map(async manufacturer=>{
      return await getManufacturerFixtures(manufacturer);
    }))
    await fs.promises.writeFile(`${__dirname}/fixture_list.json`, JSON.stringify(manufacturers), 'utf8');
  }catch(err){
    console.log(err);
  }
}

getFixtureList();