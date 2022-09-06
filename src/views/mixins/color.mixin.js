import ukColors from "@/views/components/uikit/colors/uikit.colors.js";

export default {
  methods: {
    /**
     * Returns uikit color at given index.
     * 
     * @param {Number} colorIndex index of the color
     * @returns {String} color string at provided color index
     */
    getColorFromIndex(colorIndex){
      return ukColors[Object.keys(ukColors)[colorIndex%Object.keys(ukColors).length]]
    },
    /**
     * Returns uikit index for a given color string.
     * 
     * @param {String} colorcolor string
     * @returns {String} uikit color index of provided color string
     */
    getIndexFromColor(color){
      return Object.keys(ukColors).findIndex((colorString) => ukColors[colorString] === color);
    },
    /**
     * Returns uiit colors as an array of color strings
     * 
     * @returns {Array<String>} Array of uikit color strings 
     */
    getColors(){
      return Object.keys(ukColors).map(colorKey=>ukColors[colorKey]);
    }
  },
  computed: {
    /**
     * Returns an array of HTML-formated strings s to be fed into uikit select inputs
     * 
     * @returns {Array<String>} An array of HTML-formated strings
     */
    colorOptions(){
      return Object.keys(ukColors).map((colorName) => {
        return `
        <span style="height:12px;width:12px;background:${ukColors[colorName]};margin-right:8px"></span>
        <h4>${colorName}</h4>
        `;
      });
    }
  }
}