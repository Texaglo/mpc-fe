import React from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import Web3 from 'web3';
import { toast } from 'react-toastify';
import { all, takeEvery, call, put } from 'redux-saga/effects';
import CustomToast from '../../components/toaster';
import 'react-toastify/dist/ReactToastify.css';
import {
  AlchemyUrl,
  bridgeAllowedEthCollection,
  bridgeDonorImageBaseUrl,
  bridgeDonorImageTokenOffset,
  bridgeReplacementMetadataBaseUrl,
  env,
  localBridgeNftAddress,
  localBridgeNftMaxTokenId,
  localBridgeRpcUrl,
} from '../config';
import BurnAbi from '../contract/development/BurnABI.json';

function* createBurnNftRecord({ payload }) {
  const { error, response } = yield call(postCall, { path: '/bridge/createBurnNftRecord', payload });
  if (error) EventBus.publish('error', getErrorMessage(error, 'Unable to create burn record'))
  else if (response) {
    yield put({ type: 'SET_BURN_NFT_RECORD', payload: true });
    EventBus.publish('success', response['data']['message']);
  }
};


function* mintNewNft({ payload }) {
  const { error, response } = yield call(putCall, { path: `/bridge/updateBurnNft/${payload?.tokenId}`, payload });
  if (error) EventBus.publish('error', getErrorMessage(error, 'Unable to mint NFT'))
  else if (response) {
    yield put({ type: 'SET_MINTED_NFT', payload: response.data.body });
    toast.success(<CustomToast txId={response?.data?.body?.nftTokenIdSolana} name={response?.data?.body?.nftName} />);

  }
};

function* getBurnNftHistory({ payload }) {
  const contractAddress = env === 'localhost' && localBridgeNftAddress
    ? localBridgeNftAddress
    : bridgeAllowedEthCollection;
  const query = contractAddress ? `?contractAddress=${encodeURIComponent(contractAddress)}` : '';
  const { error, response } = yield call(getCall, `/bridge/getRecords/${payload}${query}`);
  if (error) {
    EventBus.publish('error', getErrorMessage(error, 'Unable to load bridge history'));
    yield put({ type: 'BURN_NFT_HISTORY', payload: [] });
  }
  else if (response) {
    const history = Array.isArray(response?.data?.body) ? response.data.body : [];
    yield put({ type: 'BURN_NFT_HISTORY', payload: history })
  }
};


function* getWalletNft({ payload }) {
  if (env === 'localhost' && localBridgeNftAddress) {
    const { error, response } = yield call(getLocalWalletNfts, payload);

    if (error) {
      EventBus.publish('error', error.message || 'Unable to load local NFTs');
    } else {
      yield put({ type: 'SET_WALLET_NFT', payload: response });
    }
    return;
  }

  const apiKey = process.env.REACT_APP_ALCHEMY_API_KEY || 'VyJpTAKUE022dhxyEyMNqm9lj9LOPogH';
  const { error, response } = yield call(getCallExternal, `${AlchemyUrl}/nft/v2/${apiKey}/getNFTs?owner=${payload}`);

  if (error) {
    EventBus.publish('error', getErrorMessage(error, 'Unable to load wallet NFTs'));
    yield put({ type: 'SET_WALLET_NFT', payload: [] });
  } else if (response) {
    let ownedNfts = Array.isArray(response.ownedNfts) ? response.ownedNfts : [];

    if (env === 'production') {
      ownedNfts = ownedNfts.filter(nft =>
        nft.contract?.address?.toLowerCase() === bridgeAllowedEthCollection
      );
    }

    const parsedNfts = yield call(resolveWalletNftsWithReplacementMetadata, ownedNfts);

    yield put({ type: 'SET_WALLET_NFT', payload: parsedNfts });
  }
}


function* actionWatcher() {
  yield takeEvery('CREATE_BURN_NFT_RECORD', createBurnNftRecord);
  yield takeEvery('MINT_NEW_NFT', mintNewNft);
  yield takeEvery('GET_BURN_NFT_HISTORY', getBurnNftHistory);
  yield takeEvery('GET_WALLET_NFT', getWalletNft);
};

export default function* rootSaga() {
  yield all([actionWatcher()]);
};

function postCall({ path, payload }) {
  return axios
    .post(path, payload)
    .then(response => ({ response }))
    .catch(error => {
      if (error?.response?.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function getCall(path) {
  return axios
    .get(path)
    .then(response => ({ response }))
    .catch(error => {
      if (error?.response?.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function putCall({ path, payload }) {
  return axios
    .put(path, payload)
    .then(response => ({ response }))
    .catch(error => {
      if (error?.response?.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function getCallExternal(path) {
  return fetch(path)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      return { response: data };
    })
    .catch((error) => {
      if (error?.response?.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function normalizeTokenId(value) {
  if (value === undefined || value === null) return '';
  const tokenId = String(value);
  if (tokenId.toLowerCase().startsWith('0x')) {
    return Web3.utils.hexToNumberString(tokenId);
  }
  return tokenId;
}

async function fetchReplacementMetadata(tokenId) {
  if (tokenId === '') return null;

  try {
    const response = await axios.get(`/bridge/replacementMetadata/${encodeURIComponent(tokenId)}`);
    const metadata = response?.data?.body?.metadata;
    return metadata && typeof metadata === 'object' ? metadata : null;
  } catch (error) {
    return null;
  }
}

function getReplacementMetadataUri(tokenId) {
  return tokenId === '' ? '' : `${bridgeReplacementMetadataBaseUrl}/${encodeURIComponent(tokenId)}.json`;
}

function getExpectedBridgeImageUrl(tokenId) {
  if (tokenId === '') return '';
  const numericTokenId = Number(tokenId);
  if (!Number.isFinite(numericTokenId)) return '';

  return `${bridgeDonorImageBaseUrl}/${numericTokenId + bridgeDonorImageTokenOffset}.png`;
}

async function resolveWalletNftsWithReplacementMetadata(ownedNfts) {
  return Promise.all(ownedNfts.map(async (nft) => {
    const tokenId = normalizeTokenId(nft.id.tokenId);
    const replacementMetadata = await fetchReplacementMetadata(tokenId);
    const expectedMetadataUri = getReplacementMetadataUri(tokenId);
    const expectedImageUrl = getExpectedBridgeImageUrl(tokenId);
    const imageUrl = replacementMetadata?.image || expectedImageUrl;

    return {
      imageUrl,
      name: replacementMetadata?.name || nft.metadata?.name || `Modern Poker Club ${tokenId}`,
      symbol: replacementMetadata?.symbol || nft.metadata?.symbol || "MPC",
      contract: nft.contract.address,
      tokenId,
      metadataUri: expectedMetadataUri,
      metadataReady: Boolean(expectedMetadataUri && imageUrl)
    };
  }));
}

async function getLocalWalletNfts(owner) {
  try {
    const provider = localBridgeRpcUrl || window.ethereum;
    const localWeb3 = new Web3(provider);
    const localReadAbi = BurnAbi.some((item) => item.name === 'totalSupply')
      ? BurnAbi
      : [
        ...BurnAbi,
        {
          inputs: [],
          name: 'totalSupply',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];
    const contract = new localWeb3.eth.Contract(localReadAbi, localBridgeNftAddress);
    const [collectionName, collectionSymbol] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
    ]);

    let totalSupply = localBridgeNftMaxTokenId;
    if (contract.methods.totalSupply) {
      totalSupply = Number(await contract.methods.totalSupply().call());
    }

    const nfts = [];
    for (let tokenId = 1; tokenId <= totalSupply; tokenId += 1) {
      try {
        const tokenOwner = await contract.methods.ownerOf(tokenId).call();
        if (tokenOwner.toLowerCase() !== owner.toLowerCase()) continue;

        const tokenUri = await contract.methods.tokenURI(tokenId).call();
        const metadata = await fetchNftMetadata(tokenUri);
        const sourceImageUrl = normalizeNftImageUrl(metadata.image || '');
        nfts.push({
          imageUrl: sourceImageUrl,
          name: metadata.name || `${collectionName} #${tokenId}`,
          symbol: metadata.symbol || collectionSymbol,
          contract: localBridgeNftAddress,
          tokenId: `${tokenId}`,
        });
      } catch (error) {
        // Local scans intentionally skip gaps so deleted or unminted ids do not break the bridge view.
      }
    }

    return { response: nfts };
  } catch (error) {
    return { error };
  }
}

async function fetchNftMetadata(tokenUri) {
  if (!tokenUri) return {};

  if (tokenUri.startsWith('data:application/json')) {
    const [, encoded] = tokenUri.split(',');
    const json = tokenUri.includes(';base64,') ? atob(encoded) : decodeURIComponent(encoded);
    return JSON.parse(json);
  }

  const res = await fetch(tokenUri);
  const text = await res.text();
  return JSON.parse(text);
}

function normalizeNftImageUrl(url) {
  if (!url) return '';
  const ipfsPath = '/ipfs/';

  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }

  const ipfsIndex = url.indexOf(ipfsPath);
  if (ipfsIndex >= 0) {
    return `https://ipfs.io/ipfs/${url.slice(ipfsIndex + ipfsPath.length)}`;
  }

  return url;
}
