import {
  Alert,
  Button,
  Center,
  Container,
  Divider,
  Space,
  Text,
} from '@mantine/core';
import { FiAlertTriangle } from 'react-icons/fi';
import {
  useEffect,
  useState,
  Children,
  cloneElement,
  ReactElement,
} from 'react';
import { NextRouter, useRouter } from 'next/router';
import { Trans, t } from '@lingui/macro';

import { useAaveData } from '../hooks/useAaveData';
import AppBar from '../components/AppBar';
import AddressInput from '../components/AddressInput';
import AddressCard from '../components/AddressCard';
import Footer from '../components/Footer';
import { activateLocale } from './_app';

export default function HomePage() {
  const router: NextRouter = useRouter();
  const address = router?.query?.address as string;
  const isValidAddress: boolean = true;
  const { currentAddress, setCurrentAddress } = useAaveData(
    isValidAddress ? address : ''
  );

  const locale = router?.locale;

  useEffect(() => {
    // ensure current address is correctly set from url
    if (!address && currentAddress) {
      setCurrentAddress('');
    }
    if (router.query.address && router.query.address !== currentAddress) {
      if (isValidAddress) {
        setCurrentAddress(address);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    // ensure current locale is correctly set from url
    if (locale) activateLocale(locale);
  }, [locale]);

  return (
    <Container px="xs" style={{ contain: 'paint' }}>
      <AppBar />
      <AddressInput />
      {currentAddress && <AddressCard />}
      {!currentAddress && <SplashSection />}
      <Footer />
    </Container>
  );
}

function SplashSection() {
  const router: NextRouter = useRouter();
  return (
    <>
      <Center mt={15}>
        <Text fz="md" ta="center" span>
          <Trans>
            Paste an address with an Aave debt position in the box above to
            visualize how changes to borrow/supplied assets affect the position&apos;s
            health factor and borrowing power.
          </Trans>
        </Text>
      </Center>

      <Divider my="sm" variant="dashed" labelPosition="center" label={t`OR`} />

      <Center mt={15}>
        <Text fz="md" ta="center">
          <Trans>Want to go for a quick spin?</Trans>
        </Text>
      </Center>

      <Space h="md" />

      <Center>
        <RandomAddressButton />
      </Center>

      <Center mt={15}>
        <Text fz="md" ta="center">
          <Trans>Create a new simulated position in any Aave market:</Trans>
        </Text>
      </Center>

      <Space h="md" />

      <Center>
        <Button onClick={() => router.push('?address=sandbox.eth')}>
          <Trans>Build from Scratch</Trans>
        </Button>
      </Center>
    </>
  );
}

type RandomAddressButtonProps = {
  children?: React.ReactNode;
};

export function RandomAddressButton({ children }: RandomAddressButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getRandomInt = (min: number, max: number) => {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil);
  };

  const loadRandomAddress = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://omniwatch.play.hydration.cloud/api/borrowers/by-health');
      const data = await response.json();

      if (data.borrowers && data.borrowers.length > 0) {
        const randomIndex = getRandomInt(0, data.borrowers.length);
        const address = data.borrowers[randomIndex][0];
        router.push(`?address=${address}`);
      }
    } catch (error) {
      console.error('Failed to load random address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChildren = () =>
    Children.map(children, (child) =>
      cloneElement(child as ReactElement, {
        onClick: loadRandomAddress,
        disabled: isLoading,
      })
    );

  return children ? (
    <span>{renderChildren()}</span>
  ) : (
    <Button onClick={loadRandomAddress} loading={isLoading}>
      <Trans>Use Random Address</Trans>
    </Button>
  );
}

function ExperimentalAlert() {
  const [shouldDisplay, setShouldDisplay] = useState(true);

  if (!shouldDisplay) return null;

  return (
    <Alert
      mb={15}
      mt={45}
      icon={<FiAlertTriangle size="1rem" />}
      title={<Trans>Experimental!</Trans>}
      color="red"
      withCloseButton
      onClose={() => setShouldDisplay(false)}
      variant="outline"
      closeButtonLabel={t`Close alert`}
    >
      <Trans>
        This Aave debt simulator and liquidation calculator is experimental. Don&apos;t make financial decisions
        based solely on the results of this app.
      </Trans>
    </Alert>
  );
}
