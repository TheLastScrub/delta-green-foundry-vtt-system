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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
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

    html.find('.btn-add-bond').click(event => {
      event.preventDefault();
      this._addNewBond();
    });

    html.find('.btn-remove-bond').click(event => {
      event.preventDefault();
      let skillindex = event.target.getAttribute("data-index");

      this._removeBond(skillindex);
    });
    
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

  _addNewBond(){
    let updatedData = duplicate(this.actor.data.data);
    let updatedBonds = [];
    let x;

    for(x in updatedData.bonds){
      if(Number.isNumeric(x)){
        updatedBonds.push(updatedData.bonds[x]);
      }
    }

    updatedBonds.push({"description": "New", "score": updatedData.statistics.cha.value});

    updatedData.bonds = updatedBonds;

    this.actor.update({"data": updatedData});
  }

  _removeBond(pos){
    let updatedData = duplicate(this.actor.data.data);
    let updatedBonds = [];
    let x;

    for(x in updatedData.bonds){
      if(Number.isNumeric(x) && x != pos){
        updatedBonds.push(updatedData.bonds[x]);
      }
    }

    updatedData.bonds = updatedBonds;

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

    if(type == "armor"){
      itemData.data.armor = 3;
      itemData.data.expense = "Standard";
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
      let label = dataset.label ? `Rolling ${dataset.label.toUpperCase()}` : '';
      let targetVal = "";

      // check the 'data-target="something" property to determine how to grab the target for the roll
      if(Number.isNumeric(dataset.target)){
        targetVal = dataset.target;
        label += `, Target: ${targetVal}`;
      }
      else if(dataset.target === "statistic.x5"){
        let stat = this.actor.data.data.statistics[key];
        targetVal = stat.x5;
        label += `, Target: ${targetVal}`;
      }
      else if(dataset.target === "sanity"){
        targetVal = this.actor.data.data.sanity.value;
        label += `, Target: ${targetVal}`;
      }
      else if(dataset.target === "damage"){
        // damage roll, not a skill check
        label = dataset.label ? `Rolling damage for ${dataset.label.toUpperCase()}` : '';
      }
      else if(dataset.target === "lethality"){
        // a lethality roll
        label = dataset.label ? `Rolling LETHALITY for ${dataset.label.toUpperCase()}` : '';
      }

      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
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
