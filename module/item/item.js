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
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    if(item.data.isLethal){
      sendLethalityTestToChat(this.actor, item.name, item.data.lethality)
    }
    else{
      // regular damage roll
      sendDamageRollToChat(this.actor, item.name, item.data.damage);
    }
  }
}
