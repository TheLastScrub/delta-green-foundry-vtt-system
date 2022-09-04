/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * NWE - I am not sure if there is actually much point to this
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    return loadTemplates([
      "systems/deltagreen/templates/actor/actor-sheet.html",
      "systems/deltagreen/templates/actor/limited-sheet.html",
      "systems/deltagreen/templates/actor/unnatural-sheet.html",
      "systems/deltagreen/templates/actor/npc-sheet.html",
      "systems/deltagreen/templates/actor/cv-partial.html",
      "systems/deltagreen/templates/dialog/modify-percentile-roll.html",
      "systems/deltagreen/templates/actor/vehicle-sheet.html"
    ]);
  };