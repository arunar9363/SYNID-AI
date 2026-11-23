import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function HighlightedCode({ language, code }) {
  return (
    <SyntaxHighlighter style={oneDark} language={language} customStyle={{
      margin: 0, padding: 14, borderRadius: 0, background: '#0b131c', fontSize: '13px',
    }}>{code}</SyntaxHighlighter>
  );
}
