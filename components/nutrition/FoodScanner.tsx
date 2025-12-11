import React, { useState, useRef } from 'react';
import { Modal } from '../shared/Modal';
import { Icon } from '../shared/Icon';
import { useUser } from '../../context/UserContext';
import { analyzeNutritionLabel, generateRecipeFromImage } from '../../services/groqVisionService';
import type { FoodScanResult, MealType, GeneratedRecipe, Macros } from '../../types';
import { getMealTypeByTime } from '../../utils/dateUtils';
import { getHumanReadableError } from '../../utils/errorHandler';
import { colors, typography, spacing } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { fileToBase64 } from '../../utils/imageUtils';
import { Spinner } from '../shared/Spinner';

interface FoodScannerProps {
    isOpen: boolean;
    onClose: () => void;
}

const FoodScanner: React.FC<FoodScannerProps> = ({ isOpen, onClose }) => {
    const { user, macros, logMeal } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<FoodScanResult | null>(null);
    const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setGeneratedRecipe(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile || !user) return;
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const base64Full = await fileToBase64(selectedFile);
            const base64Image = base64Full.split(',')[1];
            
            if (!base64Image) {
                throw new Error("Failed to process image. Please try again.");
            }

            // fileToBase64 converts to jpeg, so we must specify that type
            const analysisResult = await analyzeNutritionLabel({ uri: base64Image, type: 'image/jpeg' }, user, macros);
            setResult(analysisResult);
        } catch (err) {
            console.error("Analysis error:", err);
            setError(getHumanReadableError(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateRecipe = async () => {
        if (!selectedFile || !user) return;
        setIsLoading(true);
        setGeneratedRecipe(null);
        setError(null);
        try {
            const base64Full = await fileToBase64(selectedFile);
            const base64Image = base64Full.split(',')[1];

            if (!base64Image) {
                throw new Error("Failed to process image. Please try again.");
            }

            // fileToBase64 converts to jpeg, so we must specify that type
            const recipeResult = await generateRecipeFromImage({ uri: base64Image, type: 'image/jpeg' }, user);
            setGeneratedRecipe(recipeResult);
        } catch (err) {
             console.error("Recipe generation error:", err);
            setError(getHumanReadableError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogMeal = (mealToLog: {name: string, macros: Macros, mealType: MealType, ingredients?: string[], instructions?: string[]}) => {
        logMeal(mealToLog);
        handleClose();
    };

    const handleCancelScan = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setResult(null);
        setGeneratedRecipe(null);
        setIsLoading(false);
        setError(null);
    };

    const handleClose = () => {
        handleCancelScan();
        onClose();
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div style={styles.centered}>
                    <Spinner size="lg" />
                    <p style={getTextStyles(isDark)}>AI is analyzing...</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div style={styles.centered}>
                    <Icon name="close" size={48} color={colors.red[400]} />
                    <p style={getErrorTextStyles(isDark)}>{error}</p>
                    <button className="btn" onClick={handleCancelScan}>Try Again</button>
                </div>
            )
        }

        if (result) {
            return (
                <div style={styles.resultContainer}>
                    <h3 className="h2" style={{textAlign: 'center'}}>Analysis Complete</h3>
                    
                    <div style={{backgroundColor: isDark ? colors.gray[700] : colors.emerald[50], padding: spacing.md, borderRadius: 8}}>
                        <h4 style={{...typography.h3, color: isDark ? colors.light : colors.dark, marginBottom: spacing.sm}}>Macros per Serving</h4>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, color: isDark ? colors.light : colors.dark}}>
                            <div><strong>Calories:</strong> {result.macros.calories}</div>
                            <div><strong>Protein:</strong> {result.macros.protein}g</div>
                            <div><strong>Carbs:</strong> {result.macros.carbs}g</div>
                            <div><strong>Fat:</strong> {result.macros.fat}g</div>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 
                            result.fitScore === 'Great Fit' ? (isDark ? colors.emerald[900] : colors.emerald[100]) :
                            result.fitScore === 'Good Fit' ? (isDark ? colors.emerald[800] : colors.emerald[50]) :
                            result.fitScore === 'Okay in Moderation' ? (isDark ? colors.amber[800] : colors.amber[100]) :
                            (isDark ? colors.red[900] : colors.red[100]),
                        padding: spacing.md,
                        borderRadius: 8
                    }}>
                        <h4 style={{
                            ...typography.h3,
                            color: 
                                result.fitScore === 'Great Fit' ? colors.emerald[600] :
                                result.fitScore === 'Good Fit' ? colors.emerald[600] :
                                result.fitScore === 'Okay in Moderation' ? colors.amber[800] :
                                colors.red[600],
                            marginBottom: spacing.sm
                        }}>
                            {result.fitScore}
                        </h4>
                        <p style={{...typography.body, color: isDark ? colors.light : colors.dark}}>{result.reason}</p>
                    </div>

                    {result.alternatives && result.alternatives.length > 0 && (
                        <div>
                            <h4 style={{...typography.h3, color: isDark ? colors.light : colors.dark, marginBottom: spacing.sm}}>Healthier Alternatives:</h4>
                            <ul style={{paddingLeft: spacing.lg, color: isDark ? colors.light : colors.dark}}>
                                {result.alternatives.map((alt, index) => (
                                    <li key={index} style={{marginBottom: spacing.xs}}>{alt}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button className="btn" onClick={() => handleLogMeal({ name: "Scanned Item", macros: result.macros, mealType: getMealTypeByTime() })}>Log Meal</button>
                    <button onClick={handleCancelScan} style={{background: 'none', border: 'none', color: colors.muted, cursor: 'pointer'}}>Try Another Image</button>
                </div>
            );
        }
        
        if (generatedRecipe) {
            // Check if the food is not suitable for the user
            if (!generatedRecipe.isSuitable) {
                return (
                    <div style={styles.resultContainer}>
                        <div style={{
                            backgroundColor: isDark ? colors.red[900] : colors.red[100],
                            padding: spacing.lg,
                            borderRadius: 12,
                            textAlign: 'center',
                            marginBottom: spacing.md
                        }}>
                            <Icon name="close" size={48} color={colors.red[400]} />
                            <h3 style={{
                                ...typography.h2,
                                color: colors.red[600],
                                marginTop: spacing.sm,
                                marginBottom: spacing.sm
                            }}>
                                Not Recommended for You
                            </h3>
                            <p style={{
                                ...typography.body,
                                color: isDark ? colors.light : colors.dark,
                                marginBottom: spacing.md
                            }}>
                                {generatedRecipe.unsuitableReason || `This food doesn't align well with your ${user?.goal} goal.`}
                            </p>
                        </div>

                        {generatedRecipe.name && (
                            <div style={{
                                backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
                                padding: spacing.md,
                                borderRadius: 8,
                                marginBottom: spacing.md
                            }}>
                                <h4 style={{...typography.h3, color: isDark ? colors.light : colors.dark, marginBottom: spacing.xs}}>
                                    Detected: {generatedRecipe.name}
                                </h4>
                                <p style={{...typography.body, color: colors.muted, marginBottom: spacing.sm}}>
                                    {generatedRecipe.description}
                                </p>
                                {generatedRecipe.macros && (
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xs, color: isDark ? colors.light : colors.dark, fontSize: typography.subtle.fontSize}}>
                                        <div>~{generatedRecipe.macros.calories} cal</div>
                                        <div>~{generatedRecipe.macros.protein}g protein</div>
                                        <div>~{generatedRecipe.macros.carbs}g carbs</div>
                                        <div>~{generatedRecipe.macros.fat}g fat</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <p style={{...typography.subtle, color: colors.muted, textAlign: 'center', marginBottom: spacing.md}}>
                            Try scanning healthier ingredients that align with your {user?.goal} goal!
                        </p>

                        <button onClick={handleCancelScan} className="btn" style={{width: '100%'}}>
                            Try Another Image
                        </button>
                    </div>
                );
            }

            // Food is suitable - show the recipe
            return (
                 <div style={styles.resultContainer}>
                    <div style={{
                        backgroundColor: isDark ? colors.emerald[900] : colors.emerald[100],
                        padding: spacing.sm,
                        borderRadius: 8,
                        textAlign: 'center',
                        marginBottom: spacing.md
                    }}>
                        <span style={{color: colors.emerald[600], fontWeight: 600}}>✓ Great choice for your {user?.goal} goal!</span>
                    </div>
                    <h3 className="h2" style={{textAlign: 'center'}}>{generatedRecipe.name}</h3>
                    <p style={getTextStyles(isDark)}>{generatedRecipe.description}</p>
                    
                    <div>
                        <h4 style={{...typography.h3, color: isDark ? colors.light : colors.dark, marginBottom: spacing.sm}}>Ingredients</h4>
                        <ul style={{paddingLeft: spacing.lg, color: isDark ? colors.light : colors.dark}}>
                            {generatedRecipe.ingredients.map((ingredient, index) => (
                                <li key={index} style={{marginBottom: spacing.xs}}>{ingredient}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 style={{...typography.h3, color: isDark ? colors.light : colors.dark, marginBottom: spacing.sm}}>Instructions</h4>
                        <ol style={{paddingLeft: spacing.lg, color: isDark ? colors.light : colors.dark}}>
                            {generatedRecipe.instructions.map((instruction, index) => (
                                <li key={index} style={{marginBottom: spacing.xs}}>{instruction}</li>
                            ))}
                        </ol>
                    </div>

                    <div style={{backgroundColor: isDark ? colors.gray[700] : colors.emerald[50], padding: spacing.md, borderRadius: 8}}>
                        <h4 style={{...typography.h3, color: isDark ? colors.light : colors.dark, marginBottom: spacing.sm}}>Nutrition per Serving</h4>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, color: isDark ? colors.light : colors.dark}}>
                            <div><strong>Calories:</strong> {generatedRecipe.macros.calories}</div>
                            <div><strong>Protein:</strong> {generatedRecipe.macros.protein}g</div>
                            <div><strong>Carbs:</strong> {generatedRecipe.macros.carbs}g</div>
                            <div><strong>Fat:</strong> {generatedRecipe.macros.fat}g</div>
                        </div>
                    </div>

                    <button className="btn" onClick={() => handleLogMeal({ ...generatedRecipe, mealType: getMealTypeByTime() })}>Log this Recipe</button>
                    <button onClick={handleCancelScan} style={{background: 'none', border: 'none', color: colors.muted, cursor: 'pointer'}}>Try Another Image</button>
                </div>
            )
        }

        if (previewUrl) {
            return (
                <div>
                    <img src={previewUrl} style={styles.previewImage} alt="Selected food" />
                    <div style={{display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.md}}>
                        <button className="btn" onClick={handleAnalyze}>Analyze Label</button>
                        <button className="btn" onClick={handleGenerateRecipe}>Generate Recipe</button>
                    </div>
                    <button onClick={handleCancelScan} style={{background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', width: '100%'}}>Cancel</button>
                </div>
            )
        }

        return (
            <div style={styles.centered}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />
                <button style={getChoiceButtonStyles(isDark)} onClick={() => fileInputRef.current?.click()}>
                    <Icon name="upload" size={24} color={colors.primary} />
                    <span>Choose from Library</span>
                </button>
                <button style={getChoiceButtonStyles(isDark)} onClick={() => {
                     const input = document.createElement('input');
                     input.type = 'file';
                     input.accept = 'image/*';
                     input.capture = 'environment';
                     input.onchange = (e) => handleFileChange(e as any);
                     input.click();
                }}>
                    <Icon name="camera" size={24} color={colors.primary} />
                    <span>Take Photo</span>
                </button>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Scan Food">
            {renderContent()}
        </Modal>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    centered: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    previewImage: {
        width: '100%',
        height: 'auto',
        maxHeight: '300px',
        objectFit: 'contain',
        borderRadius: 8,
        marginBottom: spacing.md,
    },
    resultContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    }
};
const getChoiceButtonStyles = (isDark: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: isDark ? colors.gray[700] : colors.emerald[50],
    padding: spacing.md,
    borderRadius: 8,
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    ...typography.h3,
    fontSize: 16,
    color: isDark ? colors.light : colors.dark,
});

const getTextStyles = (isDark: boolean): React.CSSProperties => ({
    ...typography.body,
    color: isDark ? colors.light : colors.dark,
    marginTop: spacing.sm,
});

const getErrorTextStyles = (_isDark: boolean): React.CSSProperties => ({
    ...typography.body,
    color: colors.red[700],
    textAlign: 'center',
    marginBottom: spacing.md,
});

export default FoodScanner;
