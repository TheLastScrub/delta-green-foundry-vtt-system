// Attempt to localize a keyword, and gracefully fallback to something else if the key does not exist.
// This way people using incomplete translations will not as many crashes or bugs when playing against a newly updated system.
export function localizeWithFallback(key, fallback){
    try{
        let translatedValue = game.i18n.localize(key);

        if(translatedValue != key){
            return translatedValue;
        }
        else{
            
            console.warn(`Untranslated localization key '${key}'.`);

            // can't have single quotes in a handlebars string literal input, so sort of hack in an escape character for them.
            fallback = fallback.replace("&#39;", "'");

            return fallback;
        }
    }
    catch(ex){
        console.warn(ex);
        return fallback;
    }
}