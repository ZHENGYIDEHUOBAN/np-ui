import { LoginAjax } from './utils';

// 登录
const Login = (userCode, userPass) => {
  return LoginAjax(userCode, userPass).then(res => {
    return res;
  });
};

export default {
  Login
};
