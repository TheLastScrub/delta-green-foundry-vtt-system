import * as DGRolls from "../roll/roll.js";

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createDeltaGreenMacro(data, slot) {
  // Definitely should not be doing assignments in conditionals but if we fix this, it breaks macro creation.
  // eslint-disable-next-line no-cond-assign
  if ((data.type = "Item" && data.itemData.type !== "weapon")) return;
  // if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.itemData;

  // Create the macro command
  let command = "// Uncomment line below to also roll skill check if desired.";
  command += `\n//game.deltagreen.rollItemSkillCheckMacro("${item._id}");`;
  command += `\ngame.deltagreen.rollItemMacro("${item._id}");`;

  // let macro = game.macros.entities.find(m => (m.name === data.name) && (m.command === command));
  // if (!macro) {
  const macro = await Macro.create({
    name: data.itemData.name,
    type: "script",
    img: data.itemData.img,
    command,
    flags: { "deltagreen.itemMacro": true },
  });
  // }

  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
export async function rollItemMacro(itemId) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn("Must have an Actor selected first.");

  let item = actor ? actor.items.find((i) => i._id === itemId) : null;

  // for backwards compatibility with older macros, where I unwisely set it to use name instead of id
  if (!item) {
    item = actor ? actor.items.find((i) => i.name === itemId) : null;
  }

  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemId}`,
    );

  // Trigger the item roll
  const r = await item.roll();

  return r;
}

export function rollItemSkillCheckMacro(itemId) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn("Must have an Actor selected first.");

  let item = actor ? actor.items.find((i) => i._id === itemId) : null;

  // for backwards compatibility with older macros, where I unwisely set it to use name instead of id
  if (!item) {
    item = actor ? actor.items.find((i) => i.name === itemId) : null;
  }

  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item '${item.name}'`,
    );

  const skillName = item.system.skill.toString();

  const roll = new DGRolls.DGPercentileRoll(
    "1D100",
    {},
    { rollType: "weapon", key: skillName, actor, item },
  );
  return actor.sheet.processRoll({}, roll);
}

export function rollSkillMacro(skillName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn("Must have an Actor selected first.");

  const skill = actor.system.skills[skillName];

  if (!skill) return ui.notifications.warn("Bad skill name passed to macro.");

  const roll = new DGRolls.DGPercentileRoll(
    "1D100",
    {},
    { rollType: "skill", key: skillName, actor },
  );
  return actor.sheet.processRoll({}, roll);
  // sendPercentileTestToChat(actor, translatedSkillLabel, skill.proficiency);
}
