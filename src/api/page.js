import { requestUitl } from './utils';
import { Base64 } from '../utils';

const PageLoad = (params) => {
  const postParams = {
    KeyWord: params.KeyWord,
    KeyWordType: params.KeyWordType || 'BO',
    sort: params.sort || '',
    select: params.select || '',
    index: params.index || '0',
    size: params.size || '0',
    swhere: Base64.encode(params.swhere || ' 1=1 '),
    extparams: `eyJlbmNvZGVzd2hlcmUiOiJ0cnVlIn0=`
  };
  return requestUitl.post(`/Form/GridPageLoad`, postParams)
    .then(res => {
      const value = JSON.parse(res.data.data.value || '[]');
      const totalcount = res.data.data.totalcount;
      return {
        data: value,
        totalCount: totalcount
      };
    })
    .catch(err => {
      return {
        success: false,
        err: err
      };
    });
};

export default {
  PageLoad
};
