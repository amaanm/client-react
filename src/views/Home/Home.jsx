/* eslint-disable */
import * as React from 'react';
import { Tabs, Tab } from 'baseui/tabs';
import { useStyletron } from 'baseui';
import Alert from 'baseui/icon/alert';
import Check from 'baseui/icon/check';
import { Notification } from 'baseui/notification';
import { hotjar } from 'react-hotjar';
import Media from 'react-media';
import { Button, SHAPE } from 'baseui/button';
import { useHistory, Redirect } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton } from 'baseui/modal';
import Navigation from '../../components/Navigation';
import StickyFooter from '../../components/StickyFooter/StickyFooter';
import { StyledAction } from 'baseui/card';
import { Input } from 'baseui/input';
import { connect } from 'react-redux';

import './Home.css';

import { register, selectMenu, initiateReset, login } from '../../store/actions/auth/auth-actions';

import passwordValidator from 'password-validator';
var schema = new passwordValidator();
schema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .has()
  .digits()
  .symbols()
  .has()
  .not()
  .spaces();

function Home(props) {
  const {
    loginDispatch,
    loginLoading,
    loginSuccess,
    initiateResetDispatch,
    signupDispatch,
    errorMessage,
    registerLoading,
    initiateResetSuccess,
    selectMenuDispatch
  } = props;

  const history = useHistory();

  // signup
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [validPassword, setValidPassword] = React.useState(false);

  // login
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetModal, setResetModal] = React.useState(false);

  const [activeKey, setActiveKey] = React.useState('0');

  const enterPressed = async event => {
    var code = event.keyCode || event.which;
    if (code === 13) {
      //13 is the enter keycode
      if (Number(activeKey) === 0) {
        handleSignup();
      } else {
        handleLogin();
      }
    }
  };

  const handleSignup = async () => {
    signupDispatch({
      env: process.env.NODE_ENV,
      name,
      email,
      username,
      password,
      rememberMe: true // by default
    });
  };

  const handleLogin = async () => {
    loginDispatch({
      env: process.env.NODE_ENV,
      username,
      password,
      rememberMe: true // by default
    });
  };

  const authenticated = localStorage.getItem('giving_tree_jwt');

  const render = () => {};

  render();

  React.useEffect(() => {
    hotjar.initialize('1751072', 6);
  }, []);

  const tabDetailJSX = () => {
    return (
      <Tabs
        overrides={{
          Tab: {
            style: {
              outline: 'none'
            }
          },
          Root: {
            style: {
              outline: 'none',
              width: '100%',
              margin: '0 auto'
            }
          },
          TabBar: {
            style: {
              outline: 'none',
              backgroundColor: 'white',
              padding: 0
            }
          },
          TabContent: {
            style: {
              paddingLeft: 0,
              paddingRight: 0,
              paddingTop: 0,
              paddingBottom: 0,
              outline: 'none',
              color: '#059305'
            }
          }
        }}
        onChange={({ activeKey }) => {
          setActiveKey(activeKey);
        }}
        activeKey={activeKey}
      >
        <Tab
          overrides={{
            Tab: {
              style: {
                marginLeft: 0,
                marginRight: 0,
                outline: 'none',
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
                width: '50%',
                color: `${activeKey === '0' && '#059305'}`,
                borderColor: `${activeKey === '0' && '#059305'}`
              }
            }
          }}
          title="Sign Up"
        >
          <div className="pt-12">
            {errorMessage && (
              <p className="my-3 text-sm" style={{ color: 'rgb(204, 50, 63)' }}>
                {errorMessage}
              </p>
            )}
            <Input
              value={name}
              onChange={event => setName(event.currentTarget.value)}
              placeholder="Name"
            />
            <br />
            <Input
              value={username}
              onChange={event => setUsername(event.currentTarget.value)}
              placeholder="Username"
            />
            <br />
            <Input
              value={email}
              onChange={event => setEmail(event.currentTarget.value)}
              placeholder="Email"
            />
            <br />
            <Input
              value={password}
              error={password && !validPassword}
              positive={password && validPassword}
              overrides={{
                After:
                  password && !validPassword ? Negative : password && validPassword ? Positive : ''
              }}
              type="password"
              onChange={event => {
                setPassword(event.currentTarget.value);

                if (schema.validate(event.currentTarget.value)) {
                  setValidPassword(true);
                } else {
                  setValidPassword(false);
                }
              }}
              placeholder="Password"
              onKeyPress={event => enterPressed(event)}
            />
            {password && !validPassword && (
              <div style={{ fontSize: 10, textAlign: 'left' }}>
                Password must be 8+ characters, at least 1 of lowercase [a-z], uppercase [A-Z],
                special character '!._*,#'), number [0-9]
              </div>
            )}

            <br />
            <StyledAction>
              <Button
                onClick={handleSignup}
                shape={SHAPE.pill}
                disabled={
                  !name || !email || !username || !password || registerLoading || !validPassword
                }
                isLoading={registerLoading}
                overrides={{
                  BaseButton: { style: { width: '100%' } }
                }}
              >
                Sign Up
              </Button>
            </StyledAction>
            <br />
            <Button
              onClick={() => history.push('/home/discover')}
              shape={SHAPE.pill}
              overrides={{
                BaseButton: { style: { width: '100%' } }
              }}
            >
              Sign Up Later
            </Button>
          </div>
        </Tab>
        <Tab
          overrides={{
            Tab: {
              style: {
                marginLeft: 0,
                marginRight: 0,
                outline: 'none',
                fontSize: 16,
                width: '50%',
                fontWeight: 'bold',
                textAlign: 'center',
                color: `${activeKey === '1' && '#059305'}`,
                borderColor: `${activeKey === '1' && '#059305'}`
              }
            }
          }}
          title="Login"
        >
          <div className="pt-12">
            {errorMessage && (
              <p
                className="my-3 text-sm"
                style={{
                  color: 'rgb(204, 50, 63)'
                }}
              >
                {errorMessage}
              </p>
            )}
            <Input
              value={username}
              onChange={event => setUsername(event.currentTarget.value)}
              placeholder="Username"
            />
            <br />
            <Input
              value={password}
              type="password"
              onChange={event => setPassword(event.currentTarget.value)}
              placeholder="Password"
              onKeyPress={event => enterPressed(event)}
            />
            <br />
            <Modal onClose={() => setResetModal(false)} isOpen={resetModal}>
              <ModalHeader>Reset Your Password</ModalHeader>
              <ModalBody>
                Please enter your email
                <Input
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="Email"
                />
              </ModalBody>
              <ModalFooter>
                <ModalButton size={'compact'} kind={'minimal'} onClick={() => setResetModal(false)}>
                  Cancel
                </ModalButton>
                <ModalButton
                  size={'compact'}
                  onClick={() => {
                    initiateResetDispatch({
                      env: process.env.NODE_ENV,
                      email: resetEmail
                    });

                    setResetModal(false);
                    setResetEmail('');
                  }}
                >
                  Reset
                </ModalButton>
              </ModalFooter>
            </Modal>
            {initiateResetSuccess && (
              <Notification
                autoHideDuration={3000}
                overrides={{
                  Body: {
                    style: {
                      position: 'fixed',
                      left: 0,
                      bottom: 0,
                      textAlign: 'center',
                      backgroundColor: 'rgb(54, 135, 89)',
                      color: 'white'
                    }
                  }
                }}
                kind={'positive'}
              >
                Reset Instructions Sent!
              </Notification>
            )}
            <div
              style={{
                textAlign: 'right',
                cursor: 'pointer',
                color: 'rgb(0, 121, 211)'
              }}
              onClick={() => setResetModal(true)}
            >
              Forgot password?
            </div>
            <br />
            <StyledAction>
              <Button
                onClick={handleLogin}
                disabled={!username || !password || loginLoading}
                shape={SHAPE.pill}
                overrides={{
                  BaseButton: { style: { width: '100%' } }
                }}
                isLoading={loginLoading}
              >
                Login
              </Button>
            </StyledAction>
          </div>
        </Tab>
      </Tabs>
    );
  };

  const detailJSX = () => {
    return (
      <div className="">
        <h1 className={`landing-title mb-4 text-center md:text-left`}>
          Request help or lend a hand
        </h1>
        <div className={`landing-text py-2 text-center md:text-left`}>
          The Giving Tree was created in response to COVID-19. Our platform connects people who need
          assistance with people who are interested in helping.
        </div>
        <div
          style={{ cursor: 'pointer' }}
          className="text-black hover:text-green-600 transition duration-150"
        >
          <a href="tel:+1415-964-4261">Hotline: +1 415-964-4261</a>
        </div>
      </div>
    );
  };

  const homeJSX = () => {
    return (
      <div className="container mx-auto max-w-xs sm:max-w-md md:max-w-screen-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 py-10">
          <div className="px-6 md:pl-12 md:pr-10 lg:px-16">{detailJSX()}</div>
          <div className="px-6 md:pl-10 md:pr-12 lg:px-16">{tabDetailJSX()}</div>
        </div>
      </div>
    );
  };

  function Negative() {
    const [css, theme] = useStyletron();
    return (
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          paddingRight: theme.sizing.scale500,
          color: theme.colors.negative400
        })}
      >
        <Alert size="18px" />
      </div>
    );
  }
  function Positive() {
    const [css, theme] = useStyletron();
    return (
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          paddingRight: theme.sizing.scale500,
          color: theme.colors.positive400
        })}
      >
        <Check size="18px" />
      </div>
    );
  }

  return (
    <StickyFooter className="h-full flex flex-col">
      <Navigation selectMenuDispatch={selectMenuDispatch} searchBarPosition="center" />
      <React.Fragment>
        <Media
          queries={{
            xs: '(max-width: 639px)',
            small: '(min-width: 640px)',
            medium: '(min-width: 768px)',
            large: '(min-width: 1024px)',
            xl: '(min-width: 1280px)'
          }}
        >
          {matches =>
            authenticated ? (
              <Redirect to={`/home/discover`} />
            ) : (
              <div className="flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                  <div
                    className="col-span-2 px-6 flex"
                    style={{
                      height: !matches.large && !matches.xl ? 340 : '100%',
                      background:
                        'url(https://d1ppmvgsdgdlyy.cloudfront.net/landing.png) center center',
                      backgroundSize: 'cover'
                    }}
                  ></div>
                  <div className="col-span-1 bg-white">{homeJSX()}</div>
                </div>
              </div>
            )
          }
        </Media>
      </React.Fragment>
    </StickyFooter>
  );
}

const mapDispatchToProps = dispatch => ({
  signupDispatch: payload => dispatch(register(payload)),
  selectMenuDispatch: payload => dispatch(selectMenu(payload)),
  loginDispatch: payload => dispatch(login(payload)),
  initiateResetDispatch: payload => dispatch(initiateReset(payload))
});

const mapStateToProps = state => ({
  user: state.auth.user,
  selectMenu: state.auth.selectMenu,
  errorMessage: state.auth.errorMessage,
  registerLoading: state.auth.registerLoading,
  registerSuccess: state.auth.registerSuccess,
  registerFailure: state.auth.registerFailure,
  isRegistered: state.auth.isRegistered,
  loginLoading: state.auth.loginLoading,
  loginSuccess: state.auth.loginSuccess,
  loginFailure: state.auth.loginFailure,
  initiateResetSuccess: state.auth.initiateResetSuccess
});

Home.defaultProps = {};

Home.propTypes = {};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
