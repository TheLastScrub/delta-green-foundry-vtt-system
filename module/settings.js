export const registerSystemSettings = function() {
    game.settings.register('deltagreen', 'characterSheetFont', {
        name: "World Font Choice",
        hint: "Choose font style for use throughout this world.",
        scope: "world",     // This specifies a world-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        choices: {           // If choices are defined, the resulting setting will be a select menu
          "TypeWriterCondensed": "Condensed Typewriter (Modern, small typewriter font)",
          "atwriter": "Another Typewriter (Older-style typewriter font)",
          "Martel": "Martel (Delta Green system default)",
          "Signika": "Signika (Foundry Default Font)"
        },
        default: "Martel",        // The default value for the setting
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
        "DefaultParchment": "Default Parchment",
        "OldPaper1": "Old Dirty Paper",
        "IvoryPaper": "Ivory White Paper"
      },
      default: "IvoryPaper",        // The default value for the setting
      onChange: value => { // A callback function which triggers when the setting is changed
        //console.log(value)
      }
  });
}