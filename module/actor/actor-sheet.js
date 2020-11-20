import { sendPercentileTestToChat, sendLethalityTestToChat, sendDamageRollToChat } from "../roll/roll.js"
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
  get template() {
    if ( !game.user.isGM && this.actor.limited ) {
      return "systems/deltagreen/templates/actor/limited-sheet.html";
    }
    else{
      //return `systems/deltagreen/templates/actor/${this.actor.data.type}-sheet.html`;
      return `systems/deltagreen/templates/actor/actor-sheet.html`;
    }
    
  }

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
  
  // Can add extra buttons to form header here if necessary
  // I don't need this right now, but maybe will move the about section to the header in the future...
  _getHeaderButtons(){
    let buttons = super._getHeaderButtons();
    let label = "";
    try{
      label = game.i18n.translations.DG.RollLuck;
    }
    catch{
      label = "Roll Luck"
    }
    
    buttons = [
      {
        label: label,
        class: "test-extra-icon",
        icon: "fas fa-dice",
        onclick: (ev) => sendPercentileTestToChat(this.actor, "Luck", 50)
      }].concat(buttons);

      //buttons = [
      //  {
      //    label: "Active Effect",
      //    class: "test-extra-icon",
      //    icon: "fas fa-bolt",
      //    onclick: (ev) => this.activeEffectTest(this)
      //  }].concat(buttons);

    return buttons;
  }

  activeEffectTest(sheet){
    console.log(sheet.actor.uuid);
    let owner = sheet.actor;

    let effect = ActiveEffect.create({
        label: "Custom Effect",
        tint: "#008000",
        icon: "icons/svg/aura.svg",
        origin: owner.uuid,
        //duration: {"rounds": 1, "seconds": null, "startTime": null, "turns": null, "startRound": null, "startTurn": null},
        disabled: false,
        changes: [{
              "key": "data.skills.firearms.proficiency", //"data.statistics.str.value", //"data.health.max",
              "mode": 2,  // 0 = custom, 1 = multiply, 2 = add, 3 = upgrade, 4 = downgrade, 5 = override
              "value": -20,
              "priority": "20"
            }]
      }, owner).create();
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
    html.find('.btn-reset-breaking-point').click(event => {
      event.preventDefault();
      let currentBreakingPoint = 0;
    
      currentBreakingPoint = this.actor.data.data.sanity.value - this.actor.data.data.statistics.pow.value;
      
      let updatedData = duplicate(this.actor.data.data);
      updatedData.sanity.currentBreakingPoint = currentBreakingPoint;
      this.actor.update({"data": updatedData});
    });

    html.find('.typed-skill-add').click(event => {
      event.preventDefault();

      let targetskill = event.target.getAttribute("data-typeskill");

      this._showNewTypeSkillDialog(targetskill);
    });

    html.find('.typed-skill-delete').click(event => {
      event.preventDefault();
      let targetskill = event.target.getAttribute("data-typedskill");

      // many bothans died to bring us this information on how to delete a property on an entity
      this.actor.update({[`data.typedSkills.-=${targetskill}`]: null});
    });
    
  }

  _showNewTypeSkillDialog(targetskill){
    let htmlContent = "";

    htmlContent += `<div>`;
    htmlContent += `     <label>${game.i18n.translations.DG.Skills.SkillGroup}:</label>`;
    htmlContent += `     <select name="new-type-skill-group" />`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.Art}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.Craft}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.ForeignLanguage}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.MilitaryScience}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.Pilot}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.Science}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG.TypeSkills.Other}</option>`;
    htmlContent += `     </select>`;
    htmlContent += `</div>`;

    htmlContent += `<div>`;
    htmlContent += `     <label>${game.i18n.translations.DG.Skills.SkillName}</label>`;
    htmlContent += `     <input type="text" name="new-type-skill-label" />`;
    htmlContent += `</div>`;

    new Dialog({
      content:htmlContent,
      title: game.i18n.translations.DG.Skills.AddTypedOrCustomSkill,
      buttons: {
        add:{
          label: game.i18n.translations.DG.Skills.AddSkill,
          callback: btn =>{
            let newTypeSkillLabel = btn.find("[name='new-type-skill-label']").val();
            let newTypeSkillGroup = btn.find("[name='new-type-skill-group']").val();
            this._addNewTypedSkill(newTypeSkillLabel, newTypeSkillGroup);
          }
        }
      }
    }).render(true);
  }

  _addNewTypedSkill(newSkillLabel, newSkillGroup){
    let updatedData = duplicate(this.actor.data.data);
    let typedSkills = updatedData.typedSkills;

    let d = new Date();

    let newSkillPropertyName = d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString() + d.getHours().toString() + d.getMinutes().toString() + d.getSeconds().toString();
    console.log(newSkillPropertyName);
    typedSkills[newSkillPropertyName] = {"label": newSkillLabel, "group": newSkillGroup, "proficiency": 0, "failure": false};

    updatedData.typedSkills = typedSkills;

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
    //const name = `New ${type.capitalize()}`;
    const name = game.i18n.localize("DG.ItemTypes.NewPrefix") + game.i18n.localize("DG.ItemTypes." + type)
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
        label = game.i18n.localize(label).toUpperCase();
        sendPercentileTestToChat(this.actor, label, targetVal);
      }
      else if(dataset.target === "statistic.x5"){
        let stat = this.actor.data.data.statistics[key];
        targetVal = stat.x5;
        label = game.i18n.localize("DG.Attributes." + key).toUpperCase();
        sendPercentileTestToChat(this.actor, label, targetVal);
      }
      else if(rollType === "sanity"){
        targetVal = this.actor.data.data.sanity.value;
        label = game.i18n.localize("DG.Attributes.SAN").toUpperCase();
        sendPercentileTestToChat(this.actor, label, targetVal);
      }
      else if(rollType === "damage"){
        // damage roll, not a skill check
        label = dataset.label ? dataset.label : '';
        sendDamageRollToChat(this.actor, label, dataset.roll);
      }
      else if(rollType === "lethality"){
        // a lethality roll
        targetVal = dataset.target;
        sendLethalityTestToChat(this.actor, label, targetVal);
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

}
