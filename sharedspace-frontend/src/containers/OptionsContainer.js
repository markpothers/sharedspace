import React from 'react'
import InstrumentSelector from '../components/InstrumentSelector'
import MusicOptions from '../components/MusicOptions'
import VideoOptions from '../components/VideoOptions'
import UsersList from '../components/UsersList'
import { io } from '../components/ioConnection'

window.io = io

export default class OptionsContainer extends React.Component {

  state = {
    users: []
  }

  displayOptions() {
    if (this.props.mode === "music") {
      return (
        <React.Fragment>
          {!this.props.chosenInstrument ? <InstrumentSelector selectInstrument={this.props.selectInstrument}/> : <MusicOptions chosenInstrument={this.props.chosenInstrument} resetInstrument={this.props.resetInstrument}/>}
        </React.Fragment>
      )
    } else if (this.props.mode === "video"){
      return (
        <React.Fragment>
          <VideoOptions updateVideoID={this.props.updateVideoID} handleChange={this.props.handleChange} />
        </React.Fragment>
      )
    }
  }

  componentDidMount() {
    if (io.connected) {
      io.emit('room', {roomID: this.props.roomID, username: localStorage.name})
    } else {
      io.on('connect', () => {
        io.emit('room', {roomID: this.props.roomID, username: localStorage.name})
      })
    }

    //
    // console.log('HERE', io) // write an if io.connected statement here, already connected "usually"
    // // socket.io.on('connect', () => {
    //   console.log("connecting on front end")
    //   io.emit('room', {roomID: this.props.roomID, username: localStorage.name} )
    // // })

    io.on('usersInRoom', users => {
      this.setState({users: users})
    })
  }

  render() {
    return (
      <div className="row" style={{flex: "1", overflow: "hidden"}}>
        <UsersList users={this.state.users} />
        {this.displayOptions()}
      </div>
    )
  }

  // componentWillUnmount() {
  //   io.emit('leaveRoom', {roomID: this.props.roomID, username: localStorage.name})
  // }
}
