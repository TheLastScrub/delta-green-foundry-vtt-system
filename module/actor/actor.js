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

    const actorData = this;
    const system = actorData.system;
    const flags = actorData.flags;

    //console.log('actor.js prepareData');
    //console.log(this);

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'agent'){
      this._prepareAgentData(this);
    }
    else if(actorData.type === 'unnatural'){
      this._prepareUnnaturalData(this);
    }
    else if(actorData.type === 'npc'){
      this._prepareNpcData(this);
    }
    else if(actorData.type === 'vehicle'){
      this._prepareVehicleData(this);
    }
  }

  /**
   * 
   * @param {*} agent 
   */

  _prepareVehicleData(actor){
    let actorData = actor;
    //const data = actorData.data;

     // calculate total armor rating
    let protection = 0;
    for (let i of actor.items) {
      if (i.type === 'armor') {
        if(i.data.data.equipped === true){
          protection += i.data.data.protection;
        }
      }
    }

    actorData.system.health.protection = protection;

    console.log(actor);
  }

 _prepareNpcData(actor){
  const { system } = actor;

  // Loop through ability scores, and add their modifiers to our sheet output.
  for (let [key, statistic] of Object.entries(system.statistics)) {
    // the x5 is just whatever the raw statistic is x 5 to turn it into a d100 percentile
    statistic.x5 = statistic.value * 5;
  }

  // initialize sanity, don't set these afterwards, as they need to be manually edited
  if(system.sanity.value >= 100){
    system.sanity.value = system.statistics.pow.x5
    system.sanity.currentBreakingPoint = system.sanity.value - system.statistics.pow.value;
  };

  system.sanity.max = 99 - system.skills.unnatural.proficiency;

  system.skills.ritual = {
    label: "Ritual",
    proficiency: 99 - system.sanity.value,
    cannotBeImprovedByFailure: true,
    failure: false
  };

  if(system.skills.ritual.proficiency > 99){
    system.skills.ritual.proficiency = 99
  }
  else if(system.skills.ritual.proficiency < 1){
    system.skills.ritual.proficiency = 1
  }

  // calculate total armor rating
  let protection = 0;
  for (let i of actor.items) {
    if (i.type === 'armor') {
      if(i.system.equipped === true){
        protection += i.system.protection;
      }
    }
  }

  system.health.protection = protection;

  console.log(actor);
}

  /**
   * 
   * @param {*} agent 
   */
  _prepareUnnaturalData(actor){
    const { system } = actor;

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, statistic] of Object.entries(system.statistics)) {
      // the x5 is just whatever the raw statistic is x 5 to turn it into a d100 percentile
      statistic.x5 = statistic.value * 5;
    }

    // calculate total armor rating
    let protection = 0;
    for (let i of actor.items) {
      if (i.type === 'armor') {
        if(i.system.equipped === true){
          protection += i.system.protection;
        }
      }
    }

    system.health.protection = protection;

    console.log(actor);
  }

  /**
   * Prepare Agent type specific data
   */
  _prepareAgentData(agent) {

    const { system } = agent;

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, statistic] of Object.entries(system.statistics)) {
      // the x5 is just whatever the raw statistic is x 5 to turn it into a d100 percentile
      statistic.x5 = statistic.value * 5;
    }
    
    // The ritual skill is from the Handler's Guide, it is for activating a ritual and is always equal to 99 - current sanity.
    // The rules can be found on page 166, under 'Ritual Activation'.
    system.skills.ritual = {
      label: "Ritual",
      proficiency: 99 - system.sanity.value,
      cannotBeImprovedByFailure: true,
      failure: false
    };

    if(system.skills.ritual.proficiency > 99){
      system.skills.ritual.proficiency = 99
    }
    else if(system.skills.ritual.proficiency < 1){
      system.skills.ritual.proficiency = 1
    }

    // The unnatural skill is sort of special
    // It cannot be improved via failure, so add in a special property to reflect this
    // Mostly to make it easy to deactivate the failure checkbox in the GUI
    for (let [key, skill] of Object.entries(system.skills)){
      if(key === 'unnatural'){
        skill.cannotBeImprovedByFailure = true;
      }
      else if(key === 'luck'){
        skill.cannotBeImprovedByFailure = true;
      }
      else if(key === 'ritual'){
        skill.cannotBeImprovedByFailure = true;
      }
      else{
        skill.cannotBeImprovedByFailure = false;
      }

      // For ritual skill, it's calculated, so add some logic to turn off changing that entirely.
      if(key === 'ritual'){
        skill.isCalculatedValue = true;
      }
      else{
        skill.isCalculatedValue = false;
      }
    }

    system.wp.max = system.statistics.pow.value;

    system.health.max = Math.ceil((system.statistics.con.value + system.statistics.str.value) / 2);

    // initialize sanity, don't set these afterwards, as they need to be manually edited
    if(system.sanity.value >= 100){
      system.sanity.value = system.statistics.pow.x5
      system.sanity.currentBreakingPoint = system.sanity.value - system.statistics.pow.value;
    };

    system.sanity.max = 99 - system.skills.unnatural.proficiency;


    // Sanity Loss Adaptations Logic
    let adaptations = system.sanity.adaptations;

    if (adaptations.violence.incident1 && adaptations.violence.incident2 && adaptations.violence.incident3){
      system.sanity.adaptations.violence.isAdapted = true;
    }
    else{
      system.sanity.adaptations.violence.isAdapted = false;
    }

    if (adaptations.helplessness.incident1 && adaptations.helplessness.incident2 && adaptations.helplessness.incident3){
      system.sanity.adaptations.helplessness.isAdapted = true;
    }
    else{
      system.sanity.adaptations.helplessness.isAdapted = false;
    }

    // calculate total armor rating
    let protection = 0;
    for (let i of agent.items) {
      if (i.type === 'armor') {
        if(i.system.equipped === true){
          protection += i.system.protection;
        }
      }
    }

    system.health.protection = protection;

    // Damage Bonus/Malus From Strength in Hand-to-hand Combat (melee/unarmed)
    let bonus = 0;
    let sbonus = "";
    let strength = system.statistics.str;

    if(strength.value < 5){
      sbonus = "-2";
      bonus = -2;
    }
    else if(strength.value < 9){
      sbonus = "-1";
      bonus = -1;
    }
    else if(strength.value > 12 && strength.value < 17){
      sbonus = "+1";
      bonus = 1;
    }
    else if(strength.value > 16){
      sbonus = "+2";
      bonus = 2;
    }
    
    system.statistics.str.meleeDamageBonus = bonus;
    system.statistics.str.meleeDamageBonusFormula = sbonus;

    console.log(agent);
  }

  /** @override */
  static async create(data, options={}) {
    data.token = data.token || {};
    if ( data.type === "agent" ) {
      mergeObject(data.token, {
        actorLink: true  // this will make the 'Link Actor Data' option for a token is checked by default. So changes to the token sheet will reflect to the actor sheet.
      }, {overwrite: false});
    }
    return super.create(data, options);
  }

  async AddUnarmedAttackItemIfMissing(){
    try{
      
      let alreadyAdded = false;

      for(let item of this.items){
        
        let flag = await item.getFlag('deltagreen', 'SystemName');

        if(flag === 'unarmed-attack' || item.name === 'Unarmed Attack'){
          alreadyAdded = true;
          break;
        }

      }

      if(alreadyAdded === true){ return; };

      let handToHandPack = await game.packs.get('deltagreen.hand-to-hand-weapons');
      let itemIndex = await handToHandPack.getIndex();            
      let toAdd = []; // createEmbeddedDocument expects an array

      for(let idx of itemIndex){
        let _temp = await handToHandPack.getDocument(idx._id);
        
        if(_temp.name === 'Unarmed Attack'){
          toAdd.push(_temp);
        }        
      }

      let newItems = await this.createEmbeddedDocuments("Item", toAdd);
      
      for(let item of newItems){
        await item.setFlag('deltagreen','AutoAdded', true);

        if(item.name === 'Unarmed Attack'){
          await item.setFlag('deltagreen','SystemName', 'unarmed-attack');
        }
      }
    }
    catch(ex){
      console.log('Error adding unarmed strike item to Actor.')
      console.log(ex);
    }
  } 

}