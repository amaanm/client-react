import * as React from 'react';
import Constants from './Constants';
import { useHistory, Link } from 'react-router-dom';
import { useStyletron } from 'baseui';
import { Spinner } from 'baseui/spinner';
import Search from 'baseui/icon/search';
import { Input } from 'baseui/input';
import { StatefulMenu, OptionProfile } from 'baseui/menu';
import { StatefulPopover, PLACEMENT } from 'baseui/popover';
import { RadioGroup, Radio } from 'baseui/radio';
import { Select } from 'baseui/select';
import { ALIGN } from 'baseui/header-navigation';
import {
  logout,
  getCurrentUser,
  addToNotifications,
  clearAllNotifications,
  selectMenu
} from '../store/actions/auth/auth-actions';
import { search } from '../store/actions/global/global-actions';
import NotificationBadge from 'react-notification-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton } from 'baseui/modal';
import { Effect } from 'react-notification-badge';
import axios from 'axios';
import ROUTES from '../utils/routes';
import { subscribeToNotifications } from '../utils/socket';
import moment from 'moment';

import { connect } from 'react-redux';
function Before() {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        display: 'flex',
        alignItems: 'center',
        paddingLeft: theme.sizing.scale500
      })}
    >
      <Search size="18px" />
    </div>
  );
}

function Navigation(props) {
  const {
    user,
    searchBarPosition,
    logoutDispatch,
    getCurrentUserDispatch,
    addToNotificationsDispatch,
    searchResults,
    selectMenuDispatch,
    searchLoading,
    clearAllNotificationsDispatch,
    searchDispatch
  } = props;

  require('dotenv').config();

  const history = useHistory();

  // Detects when mouse is clicked outside of search results
  const [shouldCloseSearchResults, setShouldCloseSearchResults] = React.useState(false);
  function useOutsideDetector(ref) {
    React.useEffect(() => {
      function handleClickOutside(event) {
        if (ref.current && !ref.current.contains(event.target)) {
          setShouldCloseSearchResults(true);
        }
      }

      // Bind the event listener
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [ref]);
  }

  /**
   * Wrapper around search results that detects when mouse clicks outside
   */
  function OutsideDetector(props) {
    const wrapperRef = React.useRef(null);
    useOutsideDetector(wrapperRef);

    return <div ref={wrapperRef}>{props.children}</div>;
  }

  function After() {
    const [css, theme] = useStyletron();
    return (
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          paddingRight: theme.sizing.scale500
        })}
      >
        {searchLoading && <Spinner size="18px" />}
      </div>
    );
  }

  const authenticated = localStorage.getItem('giving_tree_jwt');
  const [pmf, setPmf] = React.useState('');
  const [benefit, setBenefit] = React.useState('');
  const [userType, setUserType] = React.useState('');
  const [personalBenefit, setPersonalBenefit] = React.useState('');
  const [suggestion, setSuggestion] = React.useState('');

  React.useEffect(() => {
    subscribeToNotifications(user._id, (err, notification) =>
      addToNotificationsDispatch(notification)
    );
  }, [user._id, addToNotificationsDispatch]);

  React.useEffect(() => {
    console.log('updated notification');
  }, [props.markSeen, props.updatedUser]);

  const refresh = async () => {
    if (authenticated && !user.username) {
      await getCurrentUserDispatch({
        env: process.env.NODE_ENV
      });
    }
  };

  refresh();

  let notifications = user.notifications || [];

  const center = searchBarPosition === 'center';

  const [isOpen, setIsOpen] = React.useState(false);
  function close() {
    setIsOpen(false);
  }

  const handleFeedback = () => {
    const msg = {
      text: `user: ${user.email} / ${user.username}.\n\n1: PMF: ${
        Number(pmf) === 3
          ? 'Very disappointed'
          : Number(pmf) === 2
          ? 'Somewhat disappointed'
          : 'Not disappointed'
      }.\n\n2: benefit of Giving Tree: ${benefit}.\n\n3: role: ${
        userType[0].value
      }.\n\n4: personal benefit: ${personalBenefit}.\n\n5: suggestion: ${suggestion}`
    };

    const headers = {
      headers: { Authorization: `Bearer ${localStorage.getItem('giving_tree_jwt')}` }
    };

    axios
      .post(`${ROUTES[process.env.NODE_ENV].giving_tree}/feedback`, msg, headers)
      .then(success => {
        close();

        // reset
        setPmf('');
        setBenefit('');
        setUserType('');
        setPersonalBenefit('');
        setSuggestion('');

        alert('Thank You! 🌳');
      })
      .catch(err => {
        console.log('error while submitting feedback: ', err);
        alert('error while submitting feedback!');
      });
  };

  const shorten = (length, text) => {
    if (text) {
      if (text.length <= length) {
        return text;
      } else {
        return text.slice(0, length) + '...';
      }
    }
    return text;
  };

  function sanitize(str) {
    let half = str.replace(new RegExp('<em>', 'g'), '');
    let whole = half.replace(new RegExp('</em>', 'g'), '');
    return whole;
  }

  function generateHash(username = '', version) {
    const secret = 'givingtree';
    const hash = require('crypto')
      .createHmac('sha256', secret)
      .update(username.toLowerCase())
      .digest('hex');

    const suffix = Number(version) === 0 || !version ? '' : `%3Fver%3D${version}`;
    const url = `https://d1ppmvgsdgdlyy.cloudfront.net/user/${hash}${suffix}`;
    return url;
  }

  const notificationMenu = close => {
    let labels = [];

    let actionLegend = {
      Upvote: 'upvoted',
      Complete: 'completed',
      Claim: 'claimed',
      Unclaim: 'unclaimed',
      Downvote: 'downvoted',
      Comment: 'commented on',
      Reply: 'replied to',
      'New Post': 'published a new post',
      Update: 'edited their reply to'
    };

    for (var i = 0; i < notifications.length; i++) {
      let newObj = {
        label: `${notifications[i].from.username} ${actionLegend[notifications[i].action]}${
          notifications[i].action !== 'New Post'
            ? ' your ' + notifications[i].postId.type.toLowerCase()
            : ''
        }`,
        subText: notifications[i].postId.content,
        timeStamp: moment(notifications[i].postId.createdAt).format('MMM D, YYYY h:mm A'),
        postId: notifications[i].postId.postId,
        imgUrl: notifications[i].from.profilePictureUrl
      };
      labels.push(newObj);
    }

    // only show when there are notifications
    if (notifications.length > 0) {
      labels.unshift({
        label: 'Clear All Notifications'
      });
    }

    return (
      <StatefulMenu
        noResultsMsg="No Notifications"
        items={labels}
        onItemSelect={item => {
          close();
          if (item.item.label === 'Clear All Notifications') {
            clearAllNotificationsDispatch({ env: process.env.NODE_ENV });
          } else {
            history.push(`/post/${item.item.postId}/?user=${user._id}`);
          }
        }}
        overrides={{
          List: { style: { width: '400px', outline: 'none', maxHeight: '550px' } },
          ProfileImgContainer: { style: { height: '32px', width: '32px' } },
          ListItemProfile: { style: { display: 'flex', alignContent: 'center' } },
          ProfileLabelsContainer: { style: { display: 'flex', alignContent: 'center' } },
          Option: {
            component: OptionProfile,
            props: {
              getProfileItemLabels: ({ label, timeStamp, subText }) => ({
                title: shorten(20, subText),
                subtitle: label,
                body: timeStamp
              }),
              getProfileItemImg: item => item.imgUrl,
              getProfileItemImgText: item => item.label
            }
          }
        }}
      />
    );
  };

  function stringToHslColor(str = 'a', s, l) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    var h = hash % 360;
    return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
  }

  // If the user IS logged in, display this nav...
  if (authenticated) {
    return (
      <header className="flex items-center justify-start px-6 py-3 bg-white">
        <button
          className="rounded-full text-white px-4 py-2"
          style={{
            position: 'fixed',
            outline: 'none',
            backgroundColor: '#8ec755',
            bottom: '1rem',
            right: '1rem',
            zIndex: 999,
            boxShadow: `1px 1px 6px grey`
          }}
          onClick={() => setIsOpen(true)}
        >
          Give Feedback!
        </button>
        <Modal
          overrides={{ Dialog: { style: { borderRadius: '7px' } } }}
          onClose={close}
          isOpen={isOpen}
        >
          <ModalHeader>Feedback for Giving Tree</ModalHeader>
          <ModalBody>
            How would you feel if you could no longer use Giving Tree?
            <RadioGroup value={pmf} onChange={e => setPmf(e.target.value)} align={ALIGN.vertical}>
              <Radio overrides={{ Label: { style: { fontSize: 14 } } }} value="1">
                Not disappointed
              </Radio>
              <Radio overrides={{ Label: { style: { fontSize: 14 } } }} value="2">
                Somewhat disappointed
              </Radio>
              <Radio overrides={{ Label: { style: { fontSize: 14 } } }} value="3">
                Very disappointed
              </Radio>
            </RadioGroup>
            <br />
            What type of people do you think would most benefit from Giving Tree?
            <Input
              value={benefit}
              onChange={e => setBenefit(e.target.value)}
              placeholder="Type your response"
            />
            <br />
            What best describes your role?
            <Select
              options={[
                { id: 'Post Doc', value: 'Post Doc' },
                { id: 'Student', value: 'Student' },
                { id: 'Health Provider', value: 'Health Provider' },
                { id: 'Venture Capitalist', value: 'Venture Capitalist' },
                { id: 'Researcher', value: 'Researcher' },
                { id: 'Lab Director', value: 'Lab Director' },
                { id: 'Medical Doctor', value: 'Medical Doctor' },
                { id: 'Patient', value: 'Patient' },
                { id: 'Engineer', value: 'Engineer' },
                { id: 'Other', value: 'Other' }
              ]}
              labelKey="id"
              valueKey="value"
              maxDropdownHeight="250px"
              placeholder="Select role"
              onChange={({ value }) => setUserType(value)}
              value={userType}
            />
            <br />
            What is the main benefit <strong>you</strong> receive from Giving Tree?
            <Input
              value={personalBenefit}
              onChange={e => setPersonalBenefit(e.target.value)}
              placeholder="Type your response"
            />
            <br />
            How can we improve Giving Tree for you?
            <Input
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              placeholder="Type your response"
            />
          </ModalBody>
          <ModalFooter>
            <ModalButton size={'compact'} kind={'minimal'} onClick={close}>
              Cancel
            </ModalButton>
            <ModalButton size={'compact'} onClick={() => handleFeedback()}>
              Submit
            </ModalButton>
          </ModalFooter>
        </Modal>
        {/* Main logo */}
        <Link to={authenticated ? '/home/discover' : '/'} className="mr-auto">
          <img
            src="https://d1ppmvgsdgdlyy.cloudfront.net/giving_tree_long.png"
            alt="Giving Tree"
            style={{ height: 30 }}
          />
        </Link>

        {/* Search bar */}
        <div className="hidden md:block mr-auto px-6 max-w-md w-full">
          <Input
            overrides={{
              Before,
              After,
              InputContainer: {
                style: {
                  height: '100%',
                  borderBottomLeftRadius:
                    searchResults.length !== 0 && !shouldCloseSearchResults ? '0px' : '25px',
                  borderBottomRightRadius:
                    searchResults.length !== 0 && !shouldCloseSearchResults ? '0px' : '25px',
                  borderTopLeftRadius: '25px',
                  borderTopRightRadius: '25px',
                  border: '0',
                  outlineOffset: '2px'
                }
              },
              Input: {
                style: {
                  maxHeight: '100%'
                }
              }
            }}
            placeholder={'Search...'}
            onChange={e => {
              searchDispatch({ env: process.env.NODE_ENV, query: e.target.value });
              setShouldCloseSearchResults(false);
            }}
          />
          {searchResults.length !== 0 && !shouldCloseSearchResults && (
            <OutsideDetector>
              <StatefulMenu
                overrides={{
                  List: {
                    style: {
                      outline: 'none',
                      padding: '0px',
                      position: 'absolute',
                      width: `${center ? '576px' : '200px'}`,
                      maxHeight: '400px',
                      borderBottomLeftRadius: '25px',
                      borderBottomRightRadius: '25px',
                      zIndex: 100
                    }
                  },
                  ProfileImgContainer: { style: { height: '32px', width: '32px' } },
                  ListItemProfile: {
                    style: { display: 'flex', alignContent: 'center' }
                  },
                  ProfileLabelsContainer: {
                    style: { display: 'flex', alignContent: 'center' }
                  },
                  Option: {
                    component: OptionProfile,
                    props: {
                      getProfileItemLabels: ({ username, label, name, title, type }) => ({
                        title: username,
                        subtitle: (
                          <div style={{ display: 'inline' }}>
                            ...{sanitize(label.split('<em>')[0])}
                            <div style={{ backgroundColor: '#FFFF00', display: 'inline' }}>
                              {sanitize(label.split('<em>')[1].split('</em>')[0])}
                            </div>
                            {sanitize(label.split('</em>')[1])}...
                          </div>
                        ),
                        body: type === 'post' ? title : name
                      }),
                      getProfileItemImg: item => item.image,
                      getProfileItemImgText: item => (
                        <div>
                          {item.label.replace('<em>', '<strong>').replace('</em>', '</strong>')}
                        </div>
                      )
                    }
                  }
                }}
                items={searchResults}
                noResultsMsg="No Results"
                onItemSelect={item => {
                  setShouldCloseSearchResults(true);
                  history.push(
                    item.item.type === 'post'
                      ? `/post/${item.item._id}`
                      : item.item.type === 'user'
                      ? `/user/${item.item.username}`
                      : ''
                  );
                }}
              />
            </OutsideDetector>
          )}
        </div>

        {/* Submit Link */}
        <Link
          className="p-2 mr-4"
          to={Constants.PATHS.SUBMIT}
          onClick={() => {
            selectMenuDispatch({ selectMenu: '' });
            window.location = Constants.PATHS.SUBMIT;
          }}
        >
          <img
            src="https://d1ppmvgsdgdlyy.cloudfront.net/submit.svg"
            alt="document"
            style={{ height: 26 }}
          />
        </Link>

        {/* Guidelines Link */}
        <Link
          className="hidden md:block mr-5"
          to={Constants.PATHS.GUIDELINES}
          onClick={() => history.push(Constants.PATHS.GUIDELINES)}
        >
          <img
            src="https://d1ppmvgsdgdlyy.cloudfront.net/information.svg"
            alt="guidelines"
            style={{ width: 25, cursor: 'pointer' }}
          />
        </Link>

        {/* Notifications */}
        <StatefulPopover
          placement={PLACEMENT.bottomLeft}
          content={({ close }) => notificationMenu(close)}
        >
          <div
            className="flex items-center mr-5"
            style={{
              cursor: 'pointer',
              height: 40
            }}
          >
            <img
              src="https://d1ppmvgsdgdlyy.cloudfront.net/notification.svg"
              alt="notification"
              style={{ width: 25 }}
            />
            {notifications.length > 0 && (
              <div style={{ marginLeft: -10, marginRight: 20 }}>
                <NotificationBadge count={notifications.length} effect={Effect.SCALE} />
              </div>
            )}
          </div>
        </StatefulPopover>

        {/* User profile */}
        <StatefulPopover
          placement={PLACEMENT.bottomLeft}
          content={({ close }) => (
            <StatefulMenu
              items={[
                {
                  label: 'My Profile',
                  icon: 'https://d1ppmvgsdgdlyy.cloudfront.net/user.svg'
                },
                // {
                //   label: 'Settings',
                //   icon: 'https://d1ppmvgsdgdlyy.cloudfront.net/setting.svg'
                // },
                {
                  label: 'Log Out',
                  icon: 'https://d1ppmvgsdgdlyy.cloudfront.net/logout.svg'
                }
              ]}
              onItemSelect={item => {
                close();
                switch (item.item.label) {
                  case 'My Profile':
                    history.push(`/user/${user.username}`);
                    break;
                  case 'Settings':
                    history.push(`/settings`);
                    break;
                  case 'Log Out':
                    logoutDispatch({
                      env: process.env.NODE_ENV
                    });
                    break;
                  default:
                    break;
                }
              }}
              overrides={{
                List: { style: { width: '213px', outline: 'none' } }
              }}
            />
          )}
        >
          <div>
            <div
              className="profilePic flex items-center lg:hidden"
              style={{
                width: 32,
                height: 32,
                background: `url(${generateHash(
                  user.username,
                  user.profileVersion
                )}), url(https://d1ppmvgsdgdlyy.cloudfront.net/alphabet/${user.username &&
                  user.username[0].toUpperCase()}.svg), ${stringToHslColor(user.username, 80, 45)}`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                borderRadius: '50%',
                cursor: 'pointer',
                backgroundRepeat: 'no-repeat'
              }}
            ></div>
            <div
              className="hidden lg:flex items-center px-4 py-2 rounded-full 
              bg-gray-200"
            >
              <div
                className="profilePic"
                style={{
                  width: 32,
                  height: 32,
                  background: `url(${generateHash(
                    user.username,
                    user.profileVersion
                  )}), url(https://d1ppmvgsdgdlyy.cloudfront.net/alphabet/${user.username &&
                    user.username[0].toUpperCase()}.svg), ${stringToHslColor(
                    user.username,
                    80,
                    45
                  )}`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  borderRadius: '50%',
                  marginRight: 10,
                  cursor: 'pointer',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              {user.username && user.username.length < 12 ? user.username : 'Profile'}
            </div>
          </div>
        </StatefulPopover>
      </header>
    );
  } else {
    // If the user is NOT logged in, display this nav...
    return (
      <header className="flex items-center justify-start px-6 py-3 bg-white">
        {/* Main logo */}
        <Link to={authenticated ? '/home/discover' : '/'} className="mr-auto">
          <img
            src="https://d1ppmvgsdgdlyy.cloudfront.net/giving_tree_long.png"
            alt="Giving Tree"
            style={{ height: 30 }}
          />
        </Link>

        {/* Search bar */}
        <div className="hidden md:block mr-auto px-6">
          <Input
            overrides={{
              Before,
              InputContainer: {
                style: { borderRadius: '50px', border: '0', outlineOffset: '2px' }
              }
            }}
            placeholder={center ? 'Search' : 'Search'}
            onChange={e => {
              console.log('e: ', e.target.value);
              searchDispatch({ env: process.env.NODE_ENV, query: e.target.value });
            }}
          />
          {searchResults.length !== 0 && (
            <StatefulMenu
              overrides={{
                List: {
                  style: {
                    outline: 'none',
                    padding: '0px',
                    position: 'absolute',
                    width: `${center ? '600px' : '200px'}`
                  }
                }
              }}
              items={searchResults}
            />
          )}
        </div>
        <div className="ml-auto flex items-center justify-end">
          {/* Guidelines button */}
          <Link
            className="hidden md:block mr-4"
            to={Constants.PATHS.GUIDELINES}
            onClick={() => history.push(Constants.PATHS.GUIDELINES)}
          >
            <img
              src="https://d1ppmvgsdgdlyy.cloudfront.net/information.svg"
              alt="guidelines"
              style={{ width: 25, cursor: 'pointer' }}
            />
          </Link>

          {/* Login link */}
          <Link
            className="hidden md:inline mr-4"
            style={{ textDecoration: 'none' }}
            to={Constants.PATHS.LOGIN}
          >
            Login
          </Link>

          {/* Get started button */}
          <Link
            className="py-2 px-4 rounded-full text-white bg-black"
            onClick={() => history.push(Constants.PATHS.SIGNUP)}
            to={Constants.PATHS.SIGNUP}
          >
            Get started
          </Link>
        </div>
      </header>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  logoutDispatch: payload => dispatch(logout(payload)),
  getCurrentUserDispatch: payload => dispatch(getCurrentUser(payload)),
  addToNotificationsDispatch: payload => dispatch(addToNotifications(payload)),
  clearAllNotificationsDispatch: payload => dispatch(clearAllNotifications(payload)),
  searchDispatch: payload => dispatch(search(payload)),
  selectMenuDispatch: payload => dispatch(selectMenu(payload))
});

const mapStateToProps = state => ({
  user: state.auth.user,
  userLoggedIn: state.auth.userLoggedIn,
  loggingOut: state.auth.loggingOut,
  markSeen: state.auth.markSeen,
  updatedUser: state.auth.updatedUser,
  searchResults: state.global.searchResults,
  searchLoading: state.global.searchLoading
});

Navigation.defaultProps = {
  searchBarPosition: 'left'
};

Navigation.propTypes = {};

export default connect(mapStateToProps, mapDispatchToProps)(Navigation);
