import {
  Snackbar,
  SnackbarControlRef,
  useSnackbar,
} from '@anchor-protocol/snackbar';
import { useQueryBroadcaster } from '@anchor-protocol/use-broadcastable-query';
import React, {
  cloneElement,
  createRef,
  RefObject,
  useEffect,
  useRef,
} from 'react';
import styled from 'styled-components';

export const SnackbarContainer = styled(
  ({ className }: { className?: string }) => {
    const { addSnackbar, snackbarContainerRef } = useSnackbar();
    const { watch } = useQueryBroadcaster();

    const controlRefs = useRef<Map<string, RefObject<SnackbarControlRef>>>(
      new Map(),
    );

    useEffect(() => {
      const teardown = watch((id, notification) => {
        const controlRef = controlRefs.current.get(id);

        if (controlRef) {
          controlRef.current?.updateContent(
            cloneElement(notification, { key: id }),
          );
        } else {
          const controlRef = createRef<SnackbarControlRef>();

          controlRefs.current.set(id, controlRef);

          addSnackbar(
            <Snackbar
              autoClose={1000 * 30}
              controlRef={controlRef}
              onClose={() => controlRefs.current.delete(id)}
            >
              {cloneElement(notification, { key: id })}
            </Snackbar>,
          );
        }
      });

      return () => {
        teardown();
      };
    }, [addSnackbar, watch]);

    return <div ref={snackbarContainerRef} className={className} />;
  },
)`
  position: fixed;
  right: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: column-reverse;
  justify-content: right;
  align-items: flex-end;

  > * {
    margin-top: 10px;
  }
`;
