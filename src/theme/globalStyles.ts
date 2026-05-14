// app/src/theme/globalStyles.ts
import { Text, TextInput } from 'react-native';

// ✅ Override default font ของ Text ทั้งแอพ
const oldTextRender = (Text as any).render;
(Text as any).render = function (...args: any[]) {
  const origin = oldTextRender.call(this, ...args);
  return {
    ...origin,
    props: {
      ...origin.props,
      style: [
        { fontFamily: 'Quicksand-Regular' },
        origin.props.style,
      ],
    },
  };
};

// ✅ Override default font ของ TextInput ทั้งแอพ
const oldTextInputRender = (TextInput as any).render;
(TextInput as any).render = function (...args: any[]) {
  const origin = oldTextInputRender.call(this, ...args);
  return {
    ...origin,
    props: {
      ...origin.props,
      style: [
        { fontFamily: 'Quicksand-Regular' },
        origin.props.style,
      ],
    },
  };
};