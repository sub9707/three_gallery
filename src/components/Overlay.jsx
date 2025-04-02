import { Html } from "@react-three/drei";

export const Overlay = ({ buttonPressed }) => {
    return (
        <Html
            center
            style={{
                position: 'fixed',
                top: '20px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
            }}
        >
            {buttonPressed && (
                <div style={{
                    color: 'white',
                    fontSize: '24px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    transition: 'opacity 0.3s',
                    whiteSpace: 'nowrap',
                    wordBreak: 'keep-all', 
                }}>
                    상호작용 [E]
                </div>
            )}
        </Html>
    );
};