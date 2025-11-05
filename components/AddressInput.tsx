import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { t } from '@lingui/macro';

import { ActionIcon, Center, TextInput, Tooltip } from '@mantine/core';
import { FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { decodeAddress } from '@polkadot/util-crypto';

import { markets, useAaveData } from '../hooks/useAaveData';
import { RandomAddressButton } from '../pages';
import { GiDiceSixFacesFive } from "react-icons/gi";

type Props = {};

export const isValidPolkadotAddress = (address: string) => {
  try {
    const pub = decodeAddress(address);
    return !!pub && pub.length >= 20;
  } catch {
    return false;
  }
};

export const polkadotToEthAddress = (address: string) => {
  const pub = decodeAddress(address); // Uint8Array (usually 32 bytes)
  const first20 = pub.slice(0, 20); // take first 20 bytes
  const hex = ethers.utils.hexlify(first20); // 0x...
  return ethers.utils.getAddress(hex); // checksummed ETH address
};

const AddressInput = ({}: Props) => {
  const [inputAddress, setInputAddress] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const router = useRouter();
  const isUserTyping = useRef(false);

  const { currentAddress, currentMarket } = useAaveData('');

  const market = markets.find((m) => m.id === currentMarket);

  function handleSelectAddress(address: string) {
    const trimmed = address.trim();
    let finalAddress = trimmed;

    if (isValidPolkadotAddress(trimmed)) {
      try {
        finalAddress = polkadotToEthAddress(trimmed);
      } catch (err) {
        console.error('FAILED TO CONVERT POLKADOT ADDRESS:', err);
        return;
      }
    }

    if (ethers.utils.isAddress(finalAddress)) {
      const currentQueryAddress = (router?.query?.address as string) || '';
      if (currentQueryAddress !== finalAddress) {
        const query = { ...router?.query };
        query.address = finalAddress;
        router.push({
          pathname: router.pathname,
          query,
        });
      }
    } else {
      console.error('THE PROVIDED ADDRESS IS INVALID: ', finalAddress);
    }
  }

  const handleCopy = async () => {
    let toCopy = inputAddress;
    if (isValidPolkadotAddress(inputAddress)) {
      try {
        toCopy = polkadotToEthAddress(inputAddress);
      } catch {
        // fallback to copying the visible SS58 if conversion fails
        toCopy = inputAddress;
      }
    }
    try {
      await navigator.clipboard.writeText(toCopy);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2500);
    } catch (err) {
      console.error('COPY FAILED:', err);
    }
  };

  useEffect(() => {
    if (ethers.utils.isAddress(inputAddress) || isValidPolkadotAddress(inputAddress)) {
      handleSelectAddress(inputAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAddress]);

  useEffect(() => {
    // Only sync currentAddress to input if user is not actively typing
    if (!isUserTyping.current && currentAddress && currentAddress !== inputAddress) {
      setInputAddress(currentAddress);
    }
    if (!currentAddress && inputAddress) {
      setInputAddress('');
      isUserTyping.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAddress]);

  // derive an EVM address for external links (convert when possible)
  const explorerAddressForHref = (() => {
    if (!inputAddress) return inputAddress;
    let addr = inputAddress;
    if (isValidPolkadotAddress(inputAddress)) {
      try {
        addr = polkadotToEthAddress(inputAddress);
      } catch {
        addr = inputAddress;
      }
    }
    // Strip 0x prefix for explorer URL
    return addr.toLowerCase().startsWith('0x') ? addr.slice(2) : addr;
  })();

  return (
    <TextInput
      value={inputAddress || ''}
      size="lg"
      placeholder="0x... or 12ab..."
      onChange={(event) => {
        isUserTyping.current = true;
        setInputAddress(event.target.value?.trim());
      }}
      onBlur={() => {
        isUserTyping.current = false;
      }}
      inputWrapperOrder={['label', 'error', 'input', 'description']}
      rightSection={
        <Center>
          <RandomAddressButton>
            <Tooltip label={t`Use Random Address`} position="left" withArrow>
              <ActionIcon bg="#25262b" pr={4} pl={4}>
                <GiDiceSixFacesFive title={t`Use Random Address`} size={16} />
              </ActionIcon>
            </Tooltip>
          </RandomAddressButton>
          <Tooltip
            label={showCopied ? t`Address copied to clipboard!` : t`Copy address to clipboard`}
            opened={showCopied ? true : undefined}
            color={showCopied ? 'green' : undefined}
            position="left"
            withArrow
          >
            <ActionIcon bg="#25262b" pr={8}>
              <FaCopy
                title={t`Copy address to clipboard`}
                size={16}
                onClick={handleCopy}
              />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={t`View address on ${market?.explorerName}`}
            position="left"
            withArrow
          >
            <a
              title={t`Visit address details on Etherscan`}
              target="_blank"
              href={market?.explorer.replace('{{ADDRESS}}', explorerAddressForHref)}
              style={{
                color: '#e9ecef',
                marginRight: '44px',
                marginTop: '2px',
              }}
              rel="noreferrer"
            >
              <FaExternalLinkAlt size={16} />
            </a>
          </Tooltip>
        </Center>
      }
    />
  );
};

export default AddressInput;
