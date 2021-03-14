// Attempt to localize a keyword, and gracefully fallback to something else if the key does not exist.
// This way people using incomplete translations will not as many crashes or bugs when playing against a newly updated system.
export function localizeWithFallback(key, fallback){
    try{
        let translatedValue = game.i18n.localize(key);

        if(translatedValue != key){
            return translatedValue;
        }
        else{
            return fallback;
        }
    }
    catch(ex){
        ui.notifications.warn(`Missing translation for key '${key}'!`);
        return fallback;
    }
}