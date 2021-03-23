export const registerSystemSettings = function() {
    game.settings.register('deltagreen', 'characterSheetFont', {
        name: "World Font Choice",
        hint: "Choose font style for use throughout this world.",
        scope: "world",     // This specifies a world-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        choices: {           // If choices are defined, the resulting setting will be a select menu
          "SpecialElite": "Special Elite (Classic Typewriters Font)",
          "Martel": "Martel (Clean Modern Font)",
          "Signika": "Signika (Foundry Default Font)",
          "TypeWriterCondensed": "Condensed Typewriter (Modern, Small Typewriter Font)"
          //"atwriter": "Another Typewriter (Alternate Old-style Typewriter Font)"
        },
        default: "SpecialElite",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
          //console.log(value)
        }
    });

    game.settings.register('deltagreen', 'characterSheetBackgroundImageSetting', {
      name: "World Sheet Background Image",
      hint: "Choose background image for use throughout this world. (Refresh page to see change.)",
      scope: "world",     // This specifies a world-stored setting
      config: true,        // This specifies that the setting appears in the configuration view
      type: String,
      choices: {           // If choices are defined, the resulting setting will be a select menu
        "OldPaper1": "Old Dirty Paper (Good with Special Elite Font)",
        "IvoryPaper": "Ivory White Paper (Good with Martel Font)",
        "DefaultParchment": "Default Parchment (Good with Signika Font)"
      },
      default: "IvoryPaper",        // The default value for the setting
      onChange: value => { // A callback function which triggers when the setting is changed
        //console.log(value)
      }
  });
}