const axios = require('axios');
const semver = require('semver');

async function fetchPackageData(packageName) {
  const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
  return response.data;
}

async function getPackageVersions(packageName) {
  const data = await fetchPackageData(packageName);
  return Object.keys(data.versions);
}

async function checkDependencyRecursive(packageName, version, targetDep, targetVersion, cache = new Map()) {
    const cacheKey = `${packageName}@${version}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
  
    const packageData = await fetchPackageData(packageName);
    const versionData = packageData.versions[version];
    if (!versionData) return false;
  
    const dependencies = versionData.dependencies || {};
  
    for (const [depName, depRange] of Object.entries(dependencies)) {
      if (depName === targetDep) {
        // Check if the exact version matches
        const depData = await fetchPackageData(depName);
        const versions = Object.keys(depData.versions);
        const installedVersion = semver.maxSatisfying(versions, depRange);
  
        if (installedVersion !== targetVersion) {
          cache.set(cacheKey, false);
          return false;
        }
      } else {
        const depData = await fetchPackageData(depName);
        const versions = Object.keys(depData.versions);
        const maxVersion = semver.maxSatisfying(versions, depRange);
  
        if (!maxVersion) {
          cache.set(cacheKey, false);
          return false;
        }
  
        const isValid = await checkDependencyRecursive(
          depName,
          maxVersion,
          targetDep,
          targetVersion,
          cache
        );
  
        if (!isValid) {
          cache.set(cacheKey, false);
          return false;
        }
      }
    }
  
    cache.set(cacheKey, true);
    return true;
  }

async function findPatchedVersion(rootDep, rootRange, vulnerableDep, desiredVersion) {
  const allVersions = await getPackageVersions(rootDep);
  const candidates = allVersions
    .filter(v => semver.satisfies(v, rootRange))
    .sort(semver.rcompare);

  const validVersions = [];
  const cache = new Map();

  for (const version of candidates) {
    const isValid = await checkDependencyRecursive(
      rootDep,
      version,
      vulnerableDep,
      desiredVersion,
      cache
    );

    if (isValid) validVersions.push(version);
  }

  return validVersions;
}

module.exports = {
  findPatchedVersion
};