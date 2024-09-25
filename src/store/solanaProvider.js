import { Program, AnchorProvider } from '@project-serum/anchor';
import { SwapABI, SwapAddress } from "../store/contract/index";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";


const programID = new PublicKey(SwapAddress);
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
const program = new Program(SwapABI, programID, provider);

export { provider, program };