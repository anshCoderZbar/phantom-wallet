import React, { useEffect, useState, useMemo } from "react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey, Keypair } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import bs58 from "bs58";
import axios from "axios";

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          <WalletDetails />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function WalletDetails() {
  const { publicKey, wallet } = useWallet();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenDetails, setTokenDetails] = useState(null);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [tokenMetadata, setTokenMetadata] = useState(null);

  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const secretKeyBase58 =
    "58K8LezuHPQChwvtpfX8xndXNYjdseBzeZW8mHLZf5SkwUWZpxFfmmvWy9JNc4i1WFt7bBKorSEjdZz61xzhPbwV";

  useEffect(() => {
    if (publicKey) {
      const connection = new Connection(endpoint);
      connection.getBalance(publicKey).then((balance) => {
        setBalance(balance / 1e9); // Convert lamports to SOL
        setLoading(false);
      });

      // Decode the Base58 secret key to Uint8Array
      const secretKey = bs58.decode(secretKeyBase58);
      const keypair = Keypair.fromSecretKey(secretKey);
      console.log("Token Keypair Public Key:", keypair.publicKey.toBase58());

      // Fetch token details (e.g., token balance)
      connection
        .getTokenAccountsByOwner(keypair.publicKey, {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        })
        .then((tokenAccounts) => {
          if (tokenAccounts.value.length > 0) {
            const tokenAccount = tokenAccounts.value[0].pubkey;
            connection.getTokenAccountBalance(tokenAccount).then((balance) => {
              setTokenDetails(balance.value.uiAmount);
            });

            // Fetch token metadata
            fetchTokenMetadata(tokenAccount).then((metadata) => {
              setTokenMetadata(metadata);
            });
          }
        });

      // Fetch token price from CoinGecko
      axios
        .get(`https://api.coingecko.com/api/v3/simple/price`, {
          params: {
            ids: `solana`,
            vs_currencies: `usd`,
          },
        })
        .then((response) => {
          setTokenPrice(response.data.solana.usd);
        })
        .catch((error) => {
          console.error("Error fetching token price:", error);
        });
    }
  }, [publicKey, endpoint]);

  // Fetch token metadata using Solana Token Metadata Program
  const fetchTokenMetadata = async (tokenAccount) => {
    // Replace with actual call to fetch token metadata
    // This is a placeholder function. You need to integrate with Solana's Token Metadata Program or a similar service.
    return {
      name: "Solana Token",
      symbol: "SOL",
      description:
        "A decentralized blockchain built to enable scalable, user-friendly apps for the world.",
      image: "https://example.com/token-image.png",
      // Additional metadata fields
    };
  };

  if (!publicKey) {
    return <div>Connect your wallet to see details</div>;
  }

  return (
    <div>
      <div>Wallet Public Key: {publicKey.toBase58()}</div>
      {loading ? (
        <div>Loading balance...</div>
      ) : (
        <div>Balance: {balance} SOL</div>
      )}
      {tokenDetails && (
        <div>
          <div>Token Balance: {tokenDetails}</div>
        </div>
      )}
      {tokenMetadata && (
        <div>
          <div>Token Name: {tokenMetadata.name}</div>
          <div>Token Symbol: {tokenMetadata.symbol}</div>
          <div>Description: {tokenMetadata.description}</div>
          <div>
            <img src={tokenMetadata.image} alt="Token" width="50" height="50" />
          </div>
        </div>
      )}
      {tokenPrice && (
        <div>
          <div>Token Price: ${tokenPrice}</div>
        </div>
      )}
    </div>
  );
}

export default App;
