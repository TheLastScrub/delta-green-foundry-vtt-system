## Release/Patch Notes

### Version 0.9.7
* Enhancement - Can now click on the icon for armor/other gear to equip or unequip it.
* Enhancement - Changed so that players with the 'Limited' permission on an actor now only see the C.V. tab of the actor's character sheet, instead of the entire sheet.  Previously the 'Limited' permission and the 'Observer' permission gave the same result.  The 'Observer' permission is unchanged and still shows a read-only view of the entire sheet.
* Enhancement - Added ability to formula for damage rolls by either __right clicking__ *or* __holding shift and left clicking__.
* Enhancement - Added ability to alter targets for tests by either __right clicking__ *or* __holding shift and left clicking__.  Applies to the following rolls.
  * Skill tests 
  * Attribute tests 
  * Lethality tests
* Improved CSS on actor sheet in a few places.
  *  New Font (was previously in style sheet, but not actually applied).
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