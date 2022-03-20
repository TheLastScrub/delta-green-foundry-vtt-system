## Release/Patch Notes

### Version 1.0.5 - 2022-03-20

* Enhancement [GitHub #53] - Added all physical attributes (on top of DEX) as options for the test for a weapon, to accomodate a special weapon in the Jack Frost module.
* Enhancement - Put a little dice icon next to the SAN label to make it more obvious that is how you roll a SAN test on the Agent's sheet.
* Enhancement - Added some buttons to the gear tab of the Agent's sheet that allow opening the compendiums for weapons or armor directly from the sheet.
* Enhancement - Made tabs in nav bar, look a little bit more obviously like tabs.
* Enhancement - Made it so that existing type skills are more editable now, to make using the pregens that have craft/language/science skills easier.
* Enhancement - Added some GM-only fields to the CV section of the Agent and NPC sheets that supports values recording in Impossible Landscapes

### Version 1.0.4 - 2022-02-05

* Fix [GitHub #50] - The custom background images used on the Actor sheets was also showing up for other free-floating windows, such as when the encounter tracker is undocked. Because of the bright background, it was hard to read the text or see buttons, so have changed the CSS to try to exclude these windows from the custom background image.
* Fix [GitHub #43] - Bond Scores on Agent Pregens from u/jets_or_chasm fixed to correctly match charisma score of the agent.  Also re-created the compendium using a newer version of the pregen sheet that has more 

### Version 1.0.3 - 2022-02-04
* Other - Update compatible version to v9 (Note - this update could potentially have some effects on older Foundry versions)
* Fix [GitHub #48] - The new system option to hide SAN score was not also hiding Ritual proficiency, making it trivial to back-calculate the SAN score for players that know the formula for the Ritual skill.
* Fix [GitHub #50] - In Foundry v9, seems like the sections below the nav were anchored to the bottom of the window, so as the window got bigger the section would float away from the nav leaving a big gap. Attempted to fix CSS for this by setting how the grid should flex more specifically.

### Version 1.0.2 - 2021-11-04
* Fix - Pregen Agents were getting duplicated Unarmed Strike items added on creation.
* Fix - Unarmed Strike item in the compendium was using 'Melee Combat' instead of 'Unarmed Combat' as its skill.
* Enhancment - Added system option for a world to make SAN target and skill rolls hidden from non-GM players. SAN tests change to blind rolls for players who are not GM.

### Version 1.0.1 - 2021-08-14
* Fix [GitHub #31] - Default Type Skill of Art-Painting that is added automatically when making a new agent should be localizable now.
* Enhancement - Added a separate Actor type and sheet for _Unnatural_ creatures and a similar sheet that for non-agent NPC characters.
* Enhancement - The system will try to automatically add an 'Unarmed Attack' item to a new agent when they are created to make it more obvious how this is handled within the system. [Update - accidentally had this disabled in logic when packaging system, will re-add later...]
* Enhancement - DEX x5 is now selectable as an option to roll for a weapon's skill test, which is useful for items like hand grenades that are rolled or thrown.
* Enhancement - Eduard Cot (trombonecot) submitted a Catalan language pack for the system.
* Enhancement - Added list of Pregen Agents (originaly from Reddit user u/jets_or_chasm, AKA jimstorch) as a compendium pack to allow a player to jump back in quickly after a death, or to make playing for the first time easier by presenting a list of agents of 24 professions.  See https://github.com/jimstorch/DGGen for more information.
* Enhancement - Added some roll tables that allow making Fall of Delta Green-style Operation Code names (e.g. 'Operation Able Archer').  These tables are based on roll tables created by Reddit user u/Travern.  Note - there is also a compendium with a macro that will randomly pick a combination of the tables, then draw from those tables to make a random 2-part operation name to send to the chat.

### Version 1.0.0 - 2021-06-05 [BREAKING CHANGE: THIS VERSION FORWARD COMPATIBILE WITH FOUNDRY 0.8.6 OR HIGHER ONLY!!!]

* Changes to support 0.8.6+ Foundry
  * Revamped data model for actor sheet. Note due to the changes, the new system is not backwards compatible with older versions of Foundry now.
  * Rolls all asynchronous now.  Should allow less work to be required in future versions when asynchronous rolls are required.

* Enhancement - Roll Modifier Dialogues
  * Added option to choose roll mode in the roll modifier dialogue for both percentile/lethality tests and damage rolls.
  * Can now SHIFT+CLICK to get the Roll Modifier Dialogue for LUCK rolls.  Cannot seem to make it feasible to get the right-click option to work on the menu currently.
  * Changed d100 Roll Modifier dialogue to have a +/- dropdown instead of needing to type it into the box.

* Enhancement - Based on a character's strength, formula will automatically adjust for Melee and Unarmed damage rolls per the rules on page 55 of the Agent's Handbook (+1 for 13-16 STR, etc...).  **NOTE** - Some adjustment to damage formulas on existing weapons may need to be made if it was manually added already.

* Enhancement - Added a descriptor field 'Relationship' to bonds, so you can give a name, and then optionally the relationship (e.g. 'Mother', 'Friend') as two separate fields.  Makes discerning who is who on the bonds sheet easier at a glance.

* Enhancement - More CSS Improvements, mostly to Item Sheets.
  * Cleaned up layout on bonds, armor, weapons, gear item sheets
  * Made weapons, armor and gear Item Sheets slightly more uniform in how the same fields are laid out.

### Version 0.9.9 - 2021-03-27

  * Fix - [GitHub #23] - Localization mistake, had two spaces in between "Critical" and "Success" or "Failure" in chat cards.
  * Fix - [GitHub #24] - The chat card that was generated from rolling a skill check by clicking on a weapon (e.g. Firearms for a pistol) was not being localized. Fixed this along with a related tooltip that wasn't being localized either.
  * Fix - [GitHub #25] - The chat card for damage and lethality was not bolding those terms like it would for other skill or percentile rolls.
  * Fix - [GitHub #26] - When clicking on the 'Roll Luck' button in the character sheet header, the resulting chat card was not being localized properly.
  * Fix - [GitHub #27] - Using a language setting that did not have a full translation was breaking adding skills to the agent's actor sheet. Should not break quite so quickly now, but will likely need a better long term fix at some point.
  * Fix - [GitHub #28] - Missing localization keys for break point tooltips added.
  * Fix - Made Agent sheet default width a little wider so skills with longer names aren't getting clipped off.  Also a few other alignment fixes in the CSS.

  * Enhancement - [GitHub #28] - Spanish language translation, many thanks to CthulhuRol for providing it!
  * Enhancement - Added a macro that allows for rolling the skill check on a weapon, so there can be macro buttons for both the damage and the skill check if desired.
    * Sample syntax: game.deltagreen.rollItemSkillCheckMacro("Combat Dagger");
  * Enhancement - Thanks to *Uriele* - Added functionality from the Handler's Guide (page 188) for 'Inhuman' stat tests, test where the stat (e.g. CON) is 20 or higher, giving a x5 target of 100 or higher.  In this event, the test auto succeeds on a roll of anything other than 100, and a roll lower than the stat value is a critical (along with regular critical logic).
  * Enhancement - Added 'Ritual' skill, which is calculated and is equal to 99 - current sanity (thanks to *Uriele* for mentioning it).  See page 166 under 'Ritual Activation' for the full rules.
  * Enhancement - Total protection rating of all _equipped_ armor now displayed by HP.

  * Font and Background Change and Configuration Options - *NOTE THIS CAN BE CHANGED IN THE SYSTEM SETTINGS BACK TO WHAT IT WAS!*
    * Enhancement - Added system setting for font choice, with a few options.  For example you can set a world to use typewriter style font for an older feel.
    * Enhancement - Added system setting for background image choice, with a few options.  Changed default from normal Foundry parchment to a lighter, more moder looking paper.  Also included option for old, used/crinkled paper for a more unsettling or hard-used look. 

### Version 0.9.7
* Enhancement - Can now click on the icon for armor/other gear to equip or unequip it.
* Enhancement - Changed so that players with the 'Limited' permission on an actor now only see the C.V. tab of the actor's character sheet, instead of the entire sheet.  Previously the 'Limited' permission and the 'Observer' permission gave the same result.  The 'Observer' permission is unchanged and still shows a read-only view of the entire sheet.
* Enhancement - Added ability to alter formula for damage rolls by either __right clicking__ *or* __holding shift and left clicking__.
* Enhancement - Added ability to alter targets for tests by either __right clicking__ *or* __holding shift and left clicking__.  Applies to the following rolls:
  * Skill tests 
  * Attribute tests 
  * Lethality tests
* Improved CSS on actor sheet in a few places.
  *  New Font (was previously in style sheet, but not properly applied).
  *  Nav bar alignment/border consistent across tabs for a cleaner look moving between sections.
  *  Gear sheet alignment cleaner with certain fields now being centered.
  *  CV sheet now has some padding on fields so things aren't so cramped looking.
* Fix - Thanks to @Hrunh for submitting update to localization in item sheet
* Fix - typo in Alertness skill (English locale), thanks to roestrei for report

### Version 0.9.6
* Incremented Core Compatible Version after testing against release version of Foundry 0.7.5.
* Made the gear section a little less ugly by adding some nicer section dividers.
* Fixed some awkward tooltip wording.

### Version 0.9.4
* Fix - Pharmacy and Surgery skills were missing.
* Fix - Accounting and Disguise base skill rating were 0%, should be 10%.
* Fix - Damage on medium pistol in compendium was wrong, also fixed some base range values that were off.
* Enhancement - Adding support for localization.  Character sheet and items sheets (gear, bonds, etc.) should be localized now, but not the compendium packs.
* Workaround - The (current alpha) 7.2 Foundry release seems to have a bug where rolls without a leading number ('d100') do not work, so updated all skill checks to roll '1d100' instead to avoid the issue.
* Enhancement - Added support for Dice So Nice module, since moving to custom chat message broke out of the box compatibility with it.

### Version 0.9.3
We will never speak of 0.9.1 or 0.9.2 ever again.

### Version 0.9.1
Added a few compendium packs with some common armor and weapon choices for Agents to equip themselves with.  

Note that weapon/armor statistics are not covered by the Open Game License like the other rules used in the system, they are included as an exception with permission from Arc Dream publishing.

### Version 0.9.0
Basic system functionality complete and submitted to Foundry VTT as an official system.