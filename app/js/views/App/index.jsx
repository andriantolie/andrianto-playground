import React, { Component } from 'react';

class App extends Component {
  render() {
    const { children } = this.props;
    return (
      <div className='App'>
        <div><b>HEADER</b></div>
        <div>------------------------</div>
        { children }
        <div>------------------------</div>
        <div><b>FOOTER</b></div>
      </div>
    );
  }
}

export default App;
