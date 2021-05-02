import { sendPercentileTestToChat, sendLethalityTestToChat, sendDamageRollToChat, showModifyPercentileTestDialogue, showModifyDamageRollDialogue } from "../roll/roll.js"
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
      width: 700,
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
    if (this.actor.data.type == 'agent') {
      this._prepareCharacterItems(data);
    }
    //console.log(data);
    //return data.data;
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
      // Append to weapons.
      else if (i.type === 'weapon') {
        weapons.push(i);
      }
    }

    // Assign and return
    actorData.armor = armor;
    actorData.weapons = weapons;
  }
  
  // Can add extra buttons to form header here if necessary
  _getHeaderButtons(){
    let buttons = super._getHeaderButtons();
    let label = "Roll Luck";
    let label2 = "Luck";
    try{
      label = game.i18n.translations.DG.RollLuck;
      label2 = game.i18n.translations.DG.Luck;
    }
    catch{
      ui.notifications.warn('Missing translation key for either DG.RollLuck or DG.Luck key.')
    }
    
    buttons = [
      {
        label: label,
        class: "test-extra-icon",
        icon: "fas fa-dice",
        onclick: (ev) => sendPercentileTestToChat(this.actor, label2, 50)
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
      //const item = this.actor.getOwnedItem(li.data("itemId"));
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      //this.actor.deleteOwnedItem(li.data("itemId"));
      let options = {};
      this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")], options);

      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities - bind to everything with the 'Rollable' class
    //html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.rollable').mousedown(this._onRoll.bind(this));

    // Macro for toggling an item's equipped state
    html.find('.equipped-item').mousedown(this._onEquippedStatusChange.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
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
    htmlContent += `     <label>${game.i18n.translations.DG?.Skills?.SkillGroup ?? "Skill Group"}:</label>`;
    htmlContent += `     <select name="new-type-skill-group" />`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.Art ?? "Art"}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.Craft ?? "Craft"}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.ForeignLanguage ?? "Foreign Language"}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.MilitaryScience ?? "Military Science"}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.Pilot ?? "Pilot"}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.Science ?? "Science"}</option>`;
    htmlContent += `          <option>${game.i18n.translations.DG?.TypeSkills?.Other ?? "Other"}</option>`;
    htmlContent += `     </select>`;
    htmlContent += `</div>`;

    htmlContent += `<div>`;
    htmlContent += `     <label>${game.i18n.translations.DG?.Skills.SkillName ?? "Skill Name"}</label>`;
    htmlContent += `     <input type="text" name="new-type-skill-label" />`;
    htmlContent += `</div>`;

    new Dialog({
      content: htmlContent,
      title: game.i18n.translations.DG?.Skills?.AddTypedOrCustomSkill ?? "Add Typed or Custom Skill",
      buttons: {
        add:{
          label: game.i18n.translations.DG?.Skills?.AddSkill ?? "Add Skill",
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
    //return this.actor.createOwnedItem(itemData);
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
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

    if(event && event.which === 2){
      // probably don't want rolls to trigger from a middle mouse click so just kill it here
      return;
    }

    if (dataset.roll) {
      //let roll = new Roll(dataset.roll, this.actor.data.data);
      let key = dataset.label ? dataset.label : '';
      let label = dataset.label ? `${dataset.label}` : '';
      let targetVal = "";
      let rollType = dataset.rolltype ? dataset.rolltype : '';
      
      let isDamageRoll = false;
      let isLethalityRoll = false;
      
      // if shift-click or right click, bring up roll editor dialog
      let requestedModifyRoll = (event && event.shiftKey || event.which === 3); //(event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));

      // check the 'data-target="something" property to determine how to grab the target for the roll
      if(rollType === "skill" || rollType === "typeskill"){
        targetVal = dataset.target;
        label = game.i18n.localize(label).toUpperCase();
      }
      else if(dataset.target === "statistic.x5"){
        let stat = this.actor.data.data.statistics[key];
        targetVal = stat.x5;
        label = game.i18n.localize("DG.Attributes." + key).toUpperCase();
      }
      else if(rollType === "sanity"){
        targetVal = this.actor.data.data.sanity.value;
        label = game.i18n.localize("DG.Attributes.SAN").toUpperCase();
      }
      else if(rollType === "damage"){
        // damage roll, not a skill check
        isDamageRoll = true;
        label = dataset.label ? dataset.label : '';
      }
      else if(rollType === "lethality"){
        // a lethality roll
        isLethalityRoll = true;
        targetVal = dataset.target;
      }

      if(isDamageRoll){
        if(requestedModifyRoll){
          showModifyDamageRollDialogue(this.actor, label, dataset.roll);
        }
        else{
          sendDamageRollToChat(this.actor, label, dataset.roll);
        }
      }
      else{
        if(requestedModifyRoll){
          showModifyPercentileTestDialogue(this.actor, label, targetVal, isLethalityRoll);
        }
        else{
          if(isLethalityRoll)
          {
            sendLethalityTestToChat(this.actor, label, targetVal);
          }
          else{
            sendPercentileTestToChat(this.actor, label, targetVal);
          }
        }
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

  _onEquippedStatusChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    try{
      //const item = this.actor.getOwnedItem(dataset.id);
      const item = this.actor.items.get(dataset.id);
      var isEquipped = item.data.data.equipped;
      isEquipped = !isEquipped;
      item.update({data:{equipped: isEquipped}});
    }
    catch(ex){
      console.log(ex);
    }
  }

  _onDragStart(event) {
    const li = event.currentTarget;
    if ( event.target.classList.contains("entity-link") ) return;

    // Create drag data
    const dragData = {
      actorId: this.actor.id,
      sceneId: this.actor.isToken ? canvas.scene?.id : null,
      tokenId: this.actor.isToken ? this.actor.token.id : null
    };

    // Owned Items
    if ( li.dataset.itemId ) {
      const item = this.actor.items.get(li.dataset.itemId);
      dragData.type = "Item";
      dragData.data = item.data;
    }

    // Active Effect
    if ( li.dataset.effectId ) {
      const effect = this.actor.effects.get(li.dataset.effectId);
      dragData.type = "ActiveEffect";
      dragData.data = effect.data;
    }

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
}
