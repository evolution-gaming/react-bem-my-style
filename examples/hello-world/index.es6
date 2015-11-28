import React, { Component } from "react";
import { render} from "react-dom";
import MakeBem from "react-bem-my-style";
import {exampleBlock} from "css";
const CSS = MakeBem(exampleBlock);

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            element2_modifier1: true,
            element3_modifier1: true,
            element3_modifier2: true
        };
    }

    render() {
        const {element1,element2,element3} = CSS;
        const toggleState = (name)=>()=>this.setState({[name]: !this.state[name]});
        return (
            <div {...CSS()}>
                <div {...element1()}>
                    Element1
                </div>
                <div {...element2(element2.modifier1(this.state.element2_modifier1))}>
                    Element3:<br/>
                    <button type="button" onClick={toggleState("element2_modifier1")}>State1</button>
                </div>
                <div {...element3(
                    element3.modifier1(this.state.element3_modifier1),
                    element3.modifier2(this.state.element3_modifier2)
                )}>
                    Element3:<br/>
                    <button type="button" onClick={toggleState("element3_modifier1")}>State1</button>
                    <button type="button" onClick={toggleState("element3_modifier2")}>State2</button>
                </div>
            </div>
        );
    }
}

render(<App/>, document.getElementById("reactRoot"));