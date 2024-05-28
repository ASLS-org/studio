import Vue from 'vue';
import '@/assets/styles/global.css'
import '@/assets/styles/fonts.css'
import uikit from '@/views/components/uikit/'
import {storiesOf} from '@storybook/vue';
import { action } from '@storybook/addon-actions'
import theme from './theme.asls.js'
import { parse } from 'comment-parser/lib'


/**
 * Registers UI compoents
 *
 * @param {Object} components component definition module
 */
function registerComponents(components) {
    Object.keys(components).forEach(componentKey => {
        let component = components[componentKey]
        if (component.name) {
            Vue.component(component.name, component)
        } else {
            registerComponents(component)
        }
    })
}

/**
 * Generates storybook stories entirely from JSDOC style comment with custom tags:
 *      @component <component_name> <component_description> - define a component instance
 *      @story <story_name> <JSON_story_props> - define a component's story
 *
 * @function genStories
 */
function genStories(){
    const ctxRaw = require.context('!!raw-loader!@/views', true, /\.vue$/)
    const ctxVue = require.context('@/views', true, /\.vue$/);
    const files = {};
    const components = {};
    for (let filename of ctxRaw.keys()) {
        files[filename] = ctxRaw(filename);
        const parsed = parse(files[filename].default).filter(data=>{
            return data.tags.filter(tag=>{
                return tag.tag == "component"
            }).length
        })
        if(parsed.length){
            parsed.forEach(p=>{
                let component = p.tags.find(tag=>tag.tag === "component");
                let namespace = p.tags.find(tag=>tag.tag === "namespace");
                components[component.name] = ctxVue(filename).default;
                let stories = p.tags.filter(tag=>tag.tag === "story");
                let storiesHandle = storiesOf((namespace ? namespace.name + '/' : '') + component.name, components[component.name]);
                let componentDefObj = {[component.name]: components[component.name]};
                storiesHandle.addParameters({component: components[component.name], docs: {description:{ component: component.description}}});
                stories.forEach(story=>{
                    var attrs = {};
                    try{
                        attrs = JSON.parse(story.description);
                        parseProps(attrs);
                    }catch(err){
                        console.log(err);
                    }
                    storiesHandle.add(
                        story.name || "unnamed story",
                        (args, {argTypes})=>{
                            let events = Object.keys(argTypes).flatMap(key=>{
                                let arg = argTypes[key];
                                return arg.table && key!="delete" && arg.table.category === "events" ? arg : []
                            })
                            let eventString = events.map(event=>{
                                return `@${event.name}="${event.name}"`
                            }).join(" ");
                            let methods = {};
                            events.forEach(event=>{
                                methods[event.name] = action(event.name)
                            })
                            let props = Object.keys(argTypes).flatMap(key=>{
                                let arg = argTypes[key];
                                return arg.table && arg.table.category === "props" ? key : []
                            })
                            Object.keys(argTypes).forEach(key=>{
                                let arg = argTypes[key];
                                if(arg.table && (arg.table.category === "methods" || arg.table.category === "events")){
                                    arg.control = false;
                                }
                            })
                            return {
                                components: componentDefObj,
                                props: props,
                                template: 
                                `<${component.name} ${eventString} v-bind="$props">
                                    <uk-flex style="width:200px;min-height:150px;padding:10px;overflow-wrap: break-word;">
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                                            Nulla vel interdum massa. Donec sed egestas justo. 
                                            In vitae nunc interdum, malesuada turpis eget, pellentesque leo.
                                        </p>
                                    </uk-flex>
                                </${component.name}>`,
                                methods: methods,
                            }
                        },
                        {args: attrs, controls: {expanded: true}},
                    );
                });
            });
        }
    };
}

function parseProps(props){
    for(let prop in props){
        let val = props[prop]
        if(typeof val == 'object'){
            parseProps(val);
        }else if(typeof val == 'string'){
            if(val.indexOf("function()")>-1)
                props[prop] = eval("("+val+")")
        }
    }
}


registerComponents(uikit);
genStories();

export const parameters = {
    controls: {
        expanded: true,
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    viewport: {
        disable: true
    },
    backgrounds: {
        disable: true,
        grid: {
          disable: true,
        }
    },
    docs: {
      theme: theme,
    },
    layout: 'centered',
}
