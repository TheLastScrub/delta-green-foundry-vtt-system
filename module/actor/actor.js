/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class DeltaGreenActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'agent') this._prepareAgentData(actorData);
  }

  /**
   * Prepare Agent type specific data
   */
  _prepareAgentData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, statistic] of Object.entries(data.statistics)) {
      
      // the x5 is just whatever the raw statistic is x 5 to turn it into a d100 percentile
      statistic.x5 = statistic.value * 5;
    }
    //console.log(data.statistics);
    console.log(actorData);
    actorData.data.wp.max = actorData.data.statistics.pow.value;

    actorData.data.health.max = Math.ceil((actorData.data.statistics.con.value + actorData.data.statistics.str.value) / 2);

    // initialize sanity, don't set these afterwards, as they need to be manually edited
    if(actorData.data.sanity.value >= 100){
      actorData.data.sanity.value = actorData.data.statistics.pow.x5
      actorData.data.sanity.currentBreakingPoint = actorData.data.sanity.value - actorData.data.statistics.pow.value;
    };

    actorData.data.sanity.max = 99 - actorData.data.skills.unnatural.proficiency;
  }
}