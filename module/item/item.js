import { sendPercentileTestToChat, sendLethalityTestToChat, sendDamageRollToChat } from "../roll/roll.js"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DeltaGreenItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this;
    const actorData = this.actor || {};
    const system = itemData.system;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    
    const item = this;
    const actorSystemData = this.actor.system || {};

    if(item.system.isLethal){
      sendLethalityTestToChat(this.actor, item.name, item.system.lethality, game.settings.get("core", "rollMode"))
    }
    else{
      // regular damage roll

      let diceFormula = item.system.damage;
      let skillType = item.system.skill;

      if(skillType === 'unarmed_combat' || skillType === 'melee_weapons'){
        diceFormula += actorSystemData.statistics.str.meleeDamageBonusFormula;
      }

      sendDamageRollToChat(this.actor, item.name, diceFormula);
    }
  }
}
