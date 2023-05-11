const accountId = context.accountId;
const BURROW_CONTRACT = "contract.main.burrow.near";
const netLiquidityFarm = Near.view(BURROW_CONTRACT, "get_asset_farm", {
  farm_id: "NetTvl",
});
const unique = (value, index, self) => {
  return self.indexOf(value) === index;
};

const sumReducer = (sum, a) => sum + a;

function power(x, y) {
  if (y === 0) {
    return 1;
  } else if (y % 2 === 0) {
    return power(x, parseInt(y / 2)) * power(x, parseInt(y / 2));
  } else {
    return x * power(x, parseInt(y / 2)) * power(x, parseInt(y / 2));
  }
}
function getGains(account, assets, source) {
  return account[source]
    .map((accountAsset) => {
      const { token_id, balance, apr } = accountAsset;
      const asset = assets.find((asset) => asset.token_id == token_id);
      const netTvlMultiplier = asset.config.net_tvl_multiplier / 10000;
      const balanceUSD = toUsd(balance, asset);
      return [balanceUSD * (withNetTvlMultiplier ? netTvlMultiplier : 1), apr];
    })
    .reduce(
      ([gain, sum], [balance, apr]) => [gain + balance * apr, sum + balance],
      [0, 0]
    );
}
function getNetTvlRewards(assets, account) {
  const hasNetTvlFarm = !!Object.entries(netLiquidityFarm.rewards).length;
  if (!hasNetTvlFarm) return [];
  const netTvl = account.farms.find((farm) => farm.farm_id == "NetTvl");
  if (!netTvl.rewards) return [];
  return netTvl.rewards.map((reward) => {
    const { asset_farm_reward, boosted_shares, reward_token_id } = reward;
    const asset = assets.find((asset) => asset.token_id == reward_token_id);
    const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
    const boostedShares = Number(shrinkToken(boosted_shares, assetDecimals));
    const totalBoostedShares = Number(
      shrinkToken(asset_farm_reward["boosted_shares"], assetDecimals)
    );
    const totalRewardsPerDay = Number(
      shrinkToken(asset_farm_reward["reward_per_day"], assetDecimals)
    );
    const dailyAmount =
      (boostedShares / totalBoostedShares) * totalRewardsPerDay;
    return { dailyAmount, token_id: reward_token_id, price: asset.price.usd };
  });
}
const toUsd = (balance, asset) =>
  asset?.price?.usd
    ? Number(
        shrinkToken(
          balance,
          asset.metadata.decimals + asset.config.extra_decimals
        )
      ) * asset.price.usd
    : 0;

// transform tolen balance from big number decimal to number
const shrinkToken = (value, decimals, fixed) => {
  return new Big(value).div(new Big(10).pow(decimals || 0)).toFixed(fixed);
};
// get all assets, metadata and pricing from burrow contracts
function getAssets() {
  const assets = Near.view(BURROW_CONTRACT, "get_assets_paged");
  if (!assets) return;
  const tokenIds = assets?.map(([id]) => id);
  const assetsDetailed = tokenIds.map((token_id) =>
    Near.view(BURROW_CONTRACT, "get_asset", { token_id })
  );
  if (!assetsDetailed) return;
  const metadata = tokenIds?.map((token_id) =>
    Near.view(token_id, "ft_metadata")
  );
  if (!metadata) return;

  const config = Near.view(BURROW_CONTRACT, "get_config");
  if (!config) return;

  const prices =
    config && Near.view(config?.["oracle_account_id"], "get_price_data");

  const refPricesResponse = fetch(
    "https://raw.githubusercontent.com/NearDeFi/token-prices/main/ref-prices.json"
  );
  const refPrices = JSON.parse(refPricesResponse.body);

  if (!config || !prices || !refPricesResponse) return;

  const balances = accountId
    ? tokenIds.map((token_id) =>
        Near.view(token_id, "ft_balance_of", { account_id: accountId })
      )
    : undefined;

  return assetsDetailed?.map((asset, i) => {
    const price = prices?.prices?.find((p) => p.asset_id === asset?.token_id);
    const priceDecimals =
      parseInt(price?.price?.decimals || 0) - parseInt(metadata?.[i].decimals);
    const usd = price?.price?.multiplier / power(10, priceDecimals);

    const temp_temp = Big(asset.supplied.balance)
      .plus(Big(asset.reserved))
      .minus(Big(asset.borrowed.balance));
    const temp = temp_temp.minus(temp_temp.mul(0.001));
    const decimals = metadata?.[i].decimals + asset.config.extra_decimals;
    const availableLiquidity = Number(shrinkToken(temp.toFixed(), decimals));
    const extraPrice = price.price || {
      decimals: Number(refPrices?.[asset.token_id]?.decimal),
      multiplier: "1",
    };
    return {
      ...asset,
      metadata: metadata?.[i],
      accountBalance: accountId ? balances?.[i] : undefined,
      price: {
        ...extraPrice,
        usd: usd ? usd : parseFloat(refPrices?.[asset.token_id]?.price),
      },
      availableLiquidity,
    };
  });
}

// get balance of every asset on account
const getBalances = (assets) => {
  if (!assets) return;
  const balances = accountId
    ? assets.map(({ token_id }) =>
        Near.view(token_id, "ft_balance_of", { account_id: accountId })
      )
    : undefined;

  return balances;
};

// sum all balances for supplied or borrowed
// it's used for computing the net liquidity apy
const getTotalBalance = (assets, source) =>
  assets
    .map((asset) => {
      const netTvlMultiplier = asset.config.net_tvl_multiplier / 10000;
      return (
        toUsd(asset[source].balance, asset) * netTvlMultiplier +
        (source === "supplied"
          ? toUsd(asset.reserved, asset) * netTvlMultiplier
          : 0)
      );
    })
    .reduce(sumReducer, 0);

const getNetLiquidityAPY = (assets, netLiquidityFarm, account) => {
  const totalDailyNetLiquidityRewards = Object.entries(netLiquidityFarm.rewards)
    .map(([rewardTokenId, farm]) => {
      const rewardAsset = assets.find((a) => a.token_id === rewardTokenId);
      const assetDecimals =
        rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
      const dailyAmount = Number(
        shrinkToken(farm.reward_per_day, assetDecimals)
      );
      return (
        dailyAmount *
        rewardAsset.price.usd *
        (rewardAsset.config.net_tvl_multiplier / 10000)
      );
    })
    .reduce(sumReducer, 0);

  const supplied = getTotalBalance(assets, "supplied");
  const borrowed = getTotalBalance(assets, "borrowed");

  const totalProtocolLiquidity = supplied - borrowed;
  const netLiquidtyAPY =
    ((totalDailyNetLiquidityRewards * 365) / totalProtocolLiquidity) * 100;

  const rewardTokens = Object.entries(netLiquidityFarm.rewards).map(
    ([rewardTokenId]) => rewardTokenId
  );
  let accountNetLiquidtyAPY;
  if (account) {
    const [gainCollateral, totalCollateral] = getGains(
      account,
      assets,
      "collateral"
    );
    const [gainSupplied, totalSupplied] = getGains(account, assets, "supplied");
    const accountTvlRewards = getNetTvlRewards(assets, account);
    const netTvlRewards = accountTvlRewards.reduce(
      (acc, r) => acc + r.dailyAmount * r.price,
      0
    );
    const netLiquidity = totalCollateral + totalSupplied;
    accountNetLiquidtyAPY = ((netTvlRewards * 365) / netLiquidity) * 100;
  }

  return [accountNetLiquidtyAPY || netLiquidtyAPY, rewardTokens];
};

// get all farm rewards for each asset
const getRewards = (assets, account) => {
  if (!netLiquidityFarm) return;

  const [apyRewardTvl, rewardTokensTVL] = getNetLiquidityAPY(
    assets,
    netLiquidityFarm,
    account
  );

  const rewards = assets.map((asset) => {
    const apyBase = asset["supply_apr"] * 100;
    const apyBaseBorrow = asset["borrow_apr"] * 100;
    const tokenId = asset.token_id;
    const totalSupplyUsd = toUsd(asset.supplied.balance, asset);
    const totalBorrowUsd = toUsd(asset.borrowed.balance, asset);

    const suppliedFarmRewards =
      asset.farms.find((farm) => farm.farm_id.Supplied === tokenId)?.rewards ||
      {};

    const rewardTokens = Object.entries(suppliedFarmRewards)
      .map(([rewardTokenId]) => rewardTokenId)
      .concat(rewardTokensTVL)
      .filter(unique);

    const apyRewards = Object.entries(suppliedFarmRewards).map(
      ([rewardTokenId, reward]) => {
        const rewardAsset = assets.find((a) => a.token_id === rewardTokenId);
        const decimals =
          rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
        const price = rewardAsset.price?.usd || 0;
        if (!totalSupplyUsd) return 0;
        return (
          new Big(reward.reward_per_day)
            .div(new Big(10).pow(decimals || 0))
            .mul(365)
            .mul(price)
            .div(totalSupplyUsd)
            .mul(100)
            .toNumber() || 0
        );
      }
    );

    const apyReward = apyRewards.reduce(sumReducer, 0);

    const borrowedFarmRewards =
      asset.farms.find((farm) => farm.farm_id.Borrowed === tokenId)?.rewards ||
      {};

    const rewardTokensBorrow = Object.entries(borrowedFarmRewards).map(
      ([rewardTokenId]) => rewardTokenId
    );

    const apyRewardBorrow = Object.entries(borrowedFarmRewards)
      .map(([rewardTokenId, reward]) => {
        const rewardAsset = assets.find((a) => a.token_id === rewardTokenId);
        const decimals =
          rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
        const price = rewardAsset.price?.usd || 0;

        if (!totalBorrowUsd) return 0;

        return (
          new Big(reward.reward_per_day)
            .div(new Big(10).pow(decimals || 0))
            .mul(365)
            .mul(price)
            .div(totalBorrowUsd)
            .mul(100)
            .toNumber() || 0
        );
      })
      .reduce(sumReducer, 0);

    return {
      token_id: asset.token_id,
      symbol: asset.metadata.symbol,
      tvlUsd: totalSupplyUsd - totalBorrowUsd,
      apyReward,
      apyRewardTvl: apyRewardTvl || 0,
      apyBase,
      rewardTokens,
      totalSupplyUsd,
      totalBorrowUsd,
      apyBaseBorrow,
      apyRewardBorrow,
      rewardTokensBorrow,
      ltv: asset.config.volatility_ratio,
    };
  });

  return rewards;
};

// get account portfolio
const getAccount = () => {
  if (!accountId) return null;
  const account = Near.view(BURROW_CONTRACT, "get_account", {
    account_id: accountId,
  });
  return account;
};

const assets = getAssets();

if (!assets) return <div />;
const balances = getBalances(assets);
const account = getAccount();
const rewards = getRewards(assets, account);
if (!rewards) return <div />;
const data = {
  assets,
  rewards,
  balances,
  account,
};

if (typeof props.onLoad === "function") {
  props.onLoad(data);
}

return <div />;
