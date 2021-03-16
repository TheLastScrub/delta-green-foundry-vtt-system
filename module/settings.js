export const registerSystemSettings = function() {
    game.settings.register('deltagreen', 'characterSheetFont', {
        name: "World Font Choice",
        hint: "Choose font style for use throughout this world.",
        scope: "world",     // This specifies a world-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        choices: {           // If choices are defined, the resulting setting will be a select menu
          "TypeWriterCondensed": "Condensed Typewriter",
          "atwriter": "Another Typewriter",
          "Martel": "Martel",
          "Signika": "Signika"
        },
        default: "TypeWriterCondensed",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
          console.log(value)
        }
    });
}