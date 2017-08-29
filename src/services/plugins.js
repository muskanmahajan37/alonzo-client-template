/*
Dynamically loading JS plugins is an operation rife with HMR and security challenges.
This module aims to tackle that problem so that it doesn't need to be reinvented all the time.
Hopefully this also allows for greater importing flexibility in the long run.
*/

// loads libraryTarget: this, maybe DLL enabled, maybe hot reloading, plugins 

window.__modules__ = window.__modules__ || {};
const modules = window.__modules__;

if(module.hot){
    module.hot.decline();
    
}

// plugin :: ([string]: module) -> void
// export function inject(modules){
//     Object.keys(modules).reduce((acc, key) => {
//         acc.raw[key] = modules[key];
//         acc.promised[key] = Promise.resolve(acc.raw[key]);
//         return acc;
//     }, _modules);
// }


export function plugin(module: string): Promise<mixed> {
    return new Promise((resolve, reject) => {
        if(modules[module] !== undefined){
            resolve(modules[module]);
            return;
        } else {
            // sand-boxing for security TODO research proper form for the sandbox
            let window: any = undefined;
            let document: any = undefined;
            let process: any = undefined;
            let require: any = undefined;
            let exports: any = undefined;
            let req = new XMLHttpRequest();
            try {
                req.onreadystatechange = () => {
                    if (req.readyState === 4 && req.status === 200){
                        // load the module onto raw
                        (str => {
                            (new Function(str)).call(modules);
                        })(req.responseText);
                        // deal with DLLs naively
                        if(modules[module] instanceof Function){
                            modules[module] = modules[module](modules[module].s);
                        }
                        // resolve promise
                        resolve(modules[module]);
                        return;
                    } else {
                        reject(new Error(`> failed to load @{mod} plugin`));
                        return;
                    }
                }
                req.open('GET', `localhost:3674/plugin/@{mod}`, true);
                req.send(null);
            } catch(err){
                reject(err);
            }
        }
    });
}