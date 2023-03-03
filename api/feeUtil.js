/**
 * Based on code https://docs.alchemy.com/docs/how-to-build-a-gas-fee-estimator-using-eip-1559
 * @param {*} result 
 * @param {*} includePending 
 * @returns 
 */
function formatFeeHistory(historicalBlocks, result, includePending) {
  let blockNum = Number(result.oldestBlock);
  let index = 0;
  const blocks = [];
  while (blockNum < Number(result.oldestBlock) + historicalBlocks) {
    blocks.push({
      number: blockNum,
      baseFeePerGas: Number(result.baseFeePerGas[index]),
      gasUsedRatio: Number(result.gasUsedRatio[index]),
      priorityFeePerGas: result.reward[index].map(x => Number(x)),
    });
    blockNum += 1;
    index += 1;
  }
  if (includePending) {
    blocks.push({
      number: "pending",
      baseFeePerGas: Number(result.baseFeePerGas[historicalBlocks]),
      gasUsedRatio: NaN,
      priorityFeePerGas: [],
    });
  }
  return blocks;
}

async function estimateMaxFeePerGas(web3js){
    // estimate tip
    const historicalBlocks = 4;
    const feeHistory = await web3js.eth.getFeeHistory(historicalBlocks, "pending", [25, 50, 75]);
    const blocks = formatFeeHistory(historicalBlocks, feeHistory, false);
    console.log(blocks); 
    const percentilePriorityFees = blocks.map(b => b.priorityFeePerGas[2]); // use 75th percentile
    const sum = percentilePriorityFees.reduce((a, v) => a + v);
    // calculate tip (remember: decimals are not supported, so round up)
    const maxPriorityFeePerGas = Math.ceil(sum/percentilePriorityFees.length); 
    console.log("maxPriorityFeePerGas estimate", maxPriorityFeePerGas);
  
    // get base fee
    const pendingBlock = await web3js.eth.getBlock("pending");
    const baseFeePerGas = Number(pendingBlock.baseFeePerGas);
    console.log("baseFeePerGas:", baseFeePerGas); 
  
    // calculate max fee
    const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;
    console.log("maxFeePerGas:", maxFeePerGas);
  
    return maxFeePerGas;
}

module.exports = {
  estimateMaxFeePerGas,
}