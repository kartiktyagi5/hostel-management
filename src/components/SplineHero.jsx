import Spline from '@splinetool/react-spline';

export default function SplineHero() {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />

            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.8)',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 'bold',
                pointerEvents: 'none'
            }}>
                Interactive 3D Preview
            </div>
        </div>
    );
}
