/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DeltaGreenActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deltagreen", "sheet", "actor"],
      template: "systems/deltagreen/templates/actor/actor-sheet.html",
      width: 600,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    // Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const armor = [];
    const weapons = [];

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to armor.
      if (i.type === 'armor') {
        armor.push(i);
      }
      // Append to features.
      else if (i.type === 'weapon') {
        weapons.push(i);
      }
    }

    // Assign and return
    actorData.armor = armor;
    actorData.weapons = weapons;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities - bind to everything with the 'Rollable' class
    html.find('.rollable').click(this._onRoll.bind(this));
    
    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragItemStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Custom Sheet Macros
    //html.find('.btn-reset-breaking-point').click(this._resetBreakingPoint.bind(this));
    //html.find('.btn-reset-breaking-point').click((event) => {
    //  this._resetBreakingPoint(this);
    //});
    //html.find('.btn-reset-breaking-point').bind('click', this._resetBreakingPoint(this));
    html.find('.btn-reset-breaking-point').click(event => {
      event.preventDefault();
      let currentBreakingPoint = 0;
    
      currentBreakingPoint = this.actor.data.data.sanity.value - this.actor.data.data.statistics.pow.value;
      
      let updatedData = duplicate(this.actor.data.data);
      updatedData.sanity.currentBreakingPoint = currentBreakingPoint;
      this.actor.update({"data": updatedData});
    });

    html.find('.btn-add-typed-skill').click(event => {
      event.preventDefault();

      let targetskill = event.target.getAttribute("data-typeskill");

      this._showNewTypeSkillDialog(targetskill);
    });

    html.find('.btn-remove-typed-skill').click(event => {
      event.preventDefault();
      let targetskill = event.target.getAttribute("data-typeskill");
      let skillindex = event.target.getAttribute("data-index");
      let updatedData = duplicate(this.actor.data.data);

      let typesArr =  [];
      let x;
      for(x in updatedData.type_skills[targetskill].subskills){
        if(Number.isNumeric(x) && x != skillindex){
          typesArr.push(updatedData.type_skills[targetskill].subskills[x]);
        }
      }

      updatedData.type_skills[targetskill].subskills = typesArr;

      this.actor.update({"data": updatedData});
    });

    //html.find('.btn-add-bond').click(event => {
    //  event.preventDefault();
    //  this._addNewBond();
    //});

    //html.find('.btn-remove-bond').click(event => {
    //  event.preventDefault();
    //  let skillindex = event.target.getAttribute("data-index");

    //  this._removeBond(skillindex);
    //});
    
  }

  _showNewTypeSkillDialog(targetskill){
    new Dialog({
      content:`<div><input type="text" name="new-type-skill-label" /></div>`,
      title: "Add New Skill",
      buttons: {
        add:{
          label: "Add Skill",
          callback: btn =>{
            let newTypeSkillLabel = btn.find("[name='new-type-skill-label']").val();
            this._addNewTypedSkill(targetskill, newTypeSkillLabel);
          }
        }
      }
    }).render(true);
  }

  _addNewTypedSkill(targetskill, newTypeSkillLabel){
    // It sucks, but seems like Foundry and/or Handlebars somehow converts 'types' from being typed as an array to an object...
    // As such, normal array functions like 'push' won't work which makes doing the update difficult...
    // So just create an array, add all existing items to it, then use that to update the existing object.
    // Handlebars doesn't seem to be broken by this sudden update of the type from 'Object' to 'Array'.
    let updatedData = duplicate(this.actor.data.data);
    let typesArr =  [];
    let x;
    for(x in updatedData.type_skills[targetskill].subskills){
      if(Number.isNumeric(x)){
        typesArr.push(updatedData.type_skills[targetskill].subskills[x]);
      }
    }

    typesArr.push({specialization:newTypeSkillLabel, proficiency: 40, failure: false});

    updatedData.type_skills[targetskill].subskills = typesArr;

    this.actor.update({"data": updatedData});
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    if(type == "weapon"){
      itemData.data.skill = "firearms"; //default skill to firearms, since that will be most common
      itemData.data.expense = "Standard";
    }
    else if(type == "armor"){
      itemData.data.armor = 3;
      itemData.data.expense = "Standard";
    }
    else if(type == "bond"){
      itemData.data.score = this.object.data.data.statistics.cha.value; // Can vary, but at character creation starting bond score is usually agent's charisma
    }
    
    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let key = dataset.label ? dataset.label : '';
      //let label = dataset.label ? `Rolling ${dataset.label.toUpperCase()}` : '';
      let label = dataset.label ? `${dataset.label}` : '';
      let targetVal = "";
      let rollType = dataset.rolltype ? dataset.rolltype : '';

      // check the 'data-target="something" property to determine how to grab the target for the roll
      if(rollType === "skill" || rollType === "typeskill"){
        targetVal = dataset.target;
        this._sendPercentileTestToChat(label, targetVal);
      }
      else if(dataset.target === "statistic.x5"){
        let stat = this.actor.data.data.statistics[key];
        targetVal = stat.x5;
        this._sendPercentileTestToChat(label, targetVal);
      }
      else if(rollType === "sanity"){
        targetVal = this.actor.data.data.sanity.value;
        //label += `, Target: ${targetVal}`;
        this._sendPercentileTestToChat(label, targetVal);
      }
      else if(rollType === "damage"){
        // damage roll, not a skill check
        label = dataset.label ? `Rolling damage for ${dataset.label.toUpperCase()}` : '';

        roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });
      }
      else if(rollType === "lethality"){
        // a lethality roll
        targetVal = dataset.target;
        this._sendLethalityTestToChat(label, targetVal);
      }
    }
  }

  _resetBreakingPoint(event){
    event.preventDefault();
    let currentBreakingPoint = 0;
    
    currentBreakingPoint = this.actor.data.data.sanity.value - this.actor.data.data.statistics.pow.value;

    if(currentBreakingPoint < 0){
      currentBreakingPoint = 0;
    }
    
    let updatedData = duplicate(this.actor.data.data);
    updatedData.sanity.currentBreakingPoint = currentBreakingPoint;
    this.actor.update({"data": updatedData});
  }

  _sendLethalityTestToChat(weaponName, target){
    let roll = new Roll('d100', this.actor.data.data).roll();
    let isCritical = false;
    let skillCheckTotal = roll.total;
    

    // page 57 of agent's handbook
    // Lethality rolls do not fumble or critically succeed, but the attack roll can.
    // In this situation, the lethality threshold doubles (e.g. 20% would become 40%),
    // and if the lethality roll fails, the damage is doubled per normal.  However right now
    // the attack roll and damage roll are completely separate... Perhaps in the future, use a
    // hotkey to allow the doubling logic?

    // try to determine what the d100 result would be as if it was two d10's being rolled
    let damageDie1 = Math.floor(skillCheckTotal / 10);
    let damageDie2 = skillCheckTotal - (damageDie1 * 10);
    if(damageDie2 === 0){
      // if the result is evenly divisible by 10 (e.g. 30, 40, 50...) 
      // then the percentile die result was actually one lower than the calculation above would show.
      // For example, a '70' is actually a 60 + 10, so the damage die should be 6 + 10 = 16, not 7 + 0 = 7.
      damageDie1 -= 1;
      damageDie2 = 10;
    }

    let damageDie1Label = damageDie1.toString();
    let damageDie2Label = damageDie2.toString();

    if(damageDie1 === 0){
      // a roll of 00 on the tens part of the d100 counts as a ten if it becomes a damage die
      // Will leave the labeling as a '0' though, to be consistent with a regular d10 roll
      damageDie1 = 10;
    }

    if(damageDie2 === 10){
      // keep the labelling consistent, show a '0' for a ten
      damageDie2Label = '0';
    }

    let nonlethalDamage = damageDie1 + damageDie2;
    
    let isLethal = false;
    let html = '';
    let label = `Rolling LETHALITY for ${weaponName.toUpperCase()} Target ${target}`;
    let resultString = '';
    let styleOverride = '';

    if(skillCheckTotal <= target){
      isLethal = true;
      resultString = "LETHAL"
      styleOverride="color: red";
    }
    else{
      resultString = "Fail"
    }

    html = `<div class="dice-roll">`
    html += `     <div class="dice-result">`
    html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`
    html += `     <div class="dice-tooltip">`
    html += `          <section class="tooltip-part">`
    html += `               <div class="dice">`
    html += `                    <p class="part-formula">`
    html += `                         d100 OR d10 + d10`
    html += `                         <span class="part-total">${roll.total}</span>`
    html += `                    </p>`
    html += `                    <ol class="dice-rolls">`
    //html += `                         <li class="roll die d100">${roll.total}</li>`
    html += `                         <li class="roll die d10">${damageDie1Label}</li>`
    html += `                         <li class="roll die d10">${damageDie2Label}</li>`
    html += `                    </ol>`
    html += `               </div>`
    html += `          </section>`
    html += `     </div>`
    html += `     <h4 class="dice-total">${roll.total} (${nonlethalDamage} Damage)</h4>`
    html += `</div>`

    let chatData = {
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: html,
      flavor: label
      };

    // play the dice rolling sound, like a regular in-chat roll
		AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

    ChatMessage.create(chatData, {});
  }

  _sendPercentileTestToChat(skill, target){
    let roll = new Roll('d100', this.actor.data.data).roll();
    let total = roll.total;
    let isCritical = false;
    let isSuccess = false;
    let html = '';
    let label = `Rolling ${skill.toUpperCase()} Target ${target}`;
    let resultString = '';
    let styleOverride = '';

    isCritical = this._skillCheckResultIsCritical(total);

    if(total <= target){
      isSuccess = true;
    }

    if(isCritical){
      resultString = 'CRITICAL ';
    }

    if(isSuccess){
      resultString += "Success";

      if(isCritical){
        resultString = resultString.toUpperCase() + '!';
        styleOverride="color: green";
      }
    }
    else{
      resultString += "Failure";

      if(isCritical){
        resultString = resultString.toUpperCase() + '!';
        styleOverride="color: red";
      }
    }

    html = `<div class="dice-roll">`
    html += `     <div class="dice-result">`
    html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`
    html += `     <div class="dice-tooltip">`
    html += `          <section class="tooltip-part">`
    html += `               <div class="dice">`
    html += `                    <p class="part-formula">`
    html += `                         ${roll.formula}`
    html += `                         <span class="part-total">${roll.total}</span>`
    html += `                    </p>`
    html += `                    <ol class="dice-rolls">`
    html += `                         <li class="roll die ${roll.formula}">${roll.total}</li>`
    html += `                    </ol>`
    html += `               </div>`
    html += `          </section>`
    html += `     </div>`
    html += `     <h4 class="dice-total">${roll.total}</h4>`
    html += `</div>`

    let chatData = {
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: html,
      flavor: label
      };

    // play the dice rolling sound, like a regular in-chat roll
		AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

    ChatMessage.create(chatData, {});
  }

  _skillCheckResultIsCritical(rollResult){
    let isCritical = false;

    if(rollResult === 1 || rollResult === 100){
      // really good, or reeaaaally bad
      isCritical = true;
    }
    else if(rollResult % 11 === 0){
      // any matching dice are a crit, i.e. 11, 22, 33...99.
      isCritical = true;
    }

    return isCritical;
  }

}
