/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DeltaGreenActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deltagreen", "sheet", "actor"],
      template: "systems/deltagreen-unofficial/templates/actor/actor-sheet.html",
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
    const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'gear') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'weapon') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'ritual') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    actorData.gear = gear;
    actorData.features = features;
    actorData.spells = spells;
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
      let updatedData = duplicate(this.actor.data.data);

      // It sucks, but seems like Foundry and/or Handlebars always converts 'types' from an array to an object...
      // As such normal array functions like 'push' won't work.
      // So just create an array, add all existing items to it, then update the existing object.
      // Handlebars doesn't seem to be broken by this sudden change of type from 'Object' to 'Array'.
      let typesArr =  [];
      let x;
      for(x in updatedData.type_skills[targetskill].types){
        if(Number.isNumeric(x)){
          typesArr.push(updatedData.type_skills[targetskill].types[x]);
        }
      }

      typesArr.push({specialization:"New", proficiency: 0, failure: false});

      updatedData.type_skills[targetskill].types = typesArr;

      this.actor.update({"data": updatedData});
    });

    html.find('.btn-remove-typed-skill').click(event => {
      event.preventDefault();
      let targetskill = event.target.getAttribute("data-typeskill");
      let skillindex = event.target.getAttribute("data-index");
      let updatedData = duplicate(this.actor.data.data);

      let typesArr =  [];
      let x;
      for(x in updatedData.type_skills[targetskill].types){
        if(Number.isNumeric(x) && x != skillindex){
          typesArr.push(updatedData.type_skills[targetskill].types[x]);
        }
      }

      updatedData.type_skills[targetskill].types = typesArr;

      this.actor.update({"data": updatedData});
      //console.log(targetskill);
      //console.log(skillindex);
    });
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
    
    let updatedData = duplicate(this.actor.data.data);
    updatedData.sanity.currentBreakingPoint = currentBreakingPoint;
    this.actor.update({"data": updatedData});
  }

}
