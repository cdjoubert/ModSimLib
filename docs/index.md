# ModSimLib

ModSimLib is a Javascript framework that can be used to build simple user interfaces with controls, indicators and diagrams. The aim is to facilitate the representation of physical and technical systems, especially in the field of electrical engineering.

Controls include:
* Sliders
* Switches

Indicators include:
* Analog and digital meters (Voltmeters, Ammeters...)
* Indicators of power/energy flow
* Phasor diagrams
* Indicators of current flow with moving colored dots
* Curve plotting with [Flot](http://www.flotcharts.org/)

Others:
* A small ordinary differential equation (ODE) solver

## Getting Started

### Examples

* [Basic examples of control and indicators](https://cdjoubert.github.io/ModSimLib/examples/basic.html)
* [Simulate a photovoltaic module](https://cdjoubert.github.io/ModSimLib/examples/photovoltaic.html)
* [POwer factor correction](https://cdjoubert.github.io/ModSimLib/examples/power_factor.html)

### Prerequisites

The following libraries are required:
* [Konva.js](https://konvajs.github.io/): for most controls and indicators
* [sprintf.js](https://github.com/alexei/sprintf.js): used to format values
* [Flot](http://www.flotcharts.org/): for curve plotting
* [JQuery](https://jquery.com/): used by Flot



