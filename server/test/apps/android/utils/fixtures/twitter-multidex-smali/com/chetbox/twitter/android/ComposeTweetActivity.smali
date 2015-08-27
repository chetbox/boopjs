.class public Lcom/chetbox/twitter/android/ComposeTweetActivity;
.super Landroid/support/v7/app/AppCompatActivity;
.source "ComposeTweetActivity.java"

# interfaces
.implements Landroid/text/TextWatcher;
.implements Landroid/view/View$OnClickListener;


# static fields
.field public static final UPDATE_TEXT:Ljava/lang/String; = "update_text"


# instance fields
.field private mUpdateButton:Landroid/widget/Button;

.field private mUpdateText:Landroid/widget/TextView;


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 16
    invoke-direct {p0}, Landroid/support/v7/app/AppCompatActivity;-><init>()V

    return-void
.end method

.method private static isValidTweet(Ljava/lang/CharSequence;)Z
    .registers 3
    .param p0, "text"    # Ljava/lang/CharSequence;

    .prologue
    .line 71
    if-eqz p0, :cond_12

    invoke-interface {p0}, Ljava/lang/CharSequence;->length()I

    move-result v0

    if-lez v0, :cond_12

    invoke-interface {p0}, Ljava/lang/CharSequence;->length()I

    move-result v0

    const/16 v1, 0x8c

    if-gt v0, v1, :cond_12

    const/4 v0, 0x1

    :goto_11
    return v0

    :cond_12
    const/4 v0, 0x0

    goto :goto_11
.end method


# virtual methods
.method public afterTextChanged(Landroid/text/Editable;)V
    .registers 2
    .param p1, "s"    # Landroid/text/Editable;

    .prologue
    .line 67
    return-void
.end method

.method public beforeTextChanged(Ljava/lang/CharSequence;III)V
    .registers 5
    .param p1, "s"    # Ljava/lang/CharSequence;
    .param p2, "start"    # I
    .param p3, "count"    # I
    .param p4, "after"    # I

    .prologue
    .line 52
    return-void
.end method

.method public onClick(Landroid/view/View;)V
    .registers 5
    .param p1, "v"    # Landroid/view/View;

    .prologue
    .line 44
    new-instance v0, Landroid/content/Intent;

    invoke-direct {v0}, Landroid/content/Intent;-><init>()V

    .line 45
    .local v0, "updateData":Landroid/content/Intent;
    const-string v1, "update_text"

    iget-object v2, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateText:Landroid/widget/TextView;

    invoke-virtual {v2}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object v2

    invoke-interface {v2}, Ljava/lang/CharSequence;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    .line 46
    const/4 v1, -0x1

    invoke-virtual {p0, v1, v0}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->setResult(ILandroid/content/Intent;)V

    .line 47
    invoke-virtual {p0}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->finish()V

    .line 48
    return-void
.end method

.method public onCreate(Landroid/os/Bundle;)V
    .registers 5
    .param p1, "savedInstanceState"    # Landroid/os/Bundle;

    .prologue
    const/4 v2, 0x0

    .line 25
    invoke-super {p0, p1}, Landroid/support/v7/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V

    .line 26
    const v1, 0x7f040019

    invoke-virtual {p0, v1}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->setContentView(I)V

    .line 28
    invoke-static {}, Lcom/twitter/sdk/android/Twitter;->getSessionManager()Lcom/twitter/sdk/android/core/SessionManager;

    move-result-object v1

    invoke-interface {v1}, Lcom/twitter/sdk/android/core/SessionManager;->getActiveSession()Lcom/twitter/sdk/android/core/Session;

    move-result-object v0

    check-cast v0, Lcom/twitter/sdk/android/core/TwitterSession;

    .line 29
    .local v0, "session":Lcom/twitter/sdk/android/core/TwitterSession;
    invoke-virtual {v0}, Lcom/twitter/sdk/android/core/TwitterSession;->getUserName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {p0, v1}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->setTitle(Ljava/lang/CharSequence;)V

    .line 31
    const v1, 0x7f0e0051

    invoke-virtual {p0, v1}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->findViewById(I)Landroid/view/View;

    move-result-object v1

    check-cast v1, Landroid/widget/TextView;

    iput-object v1, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateText:Landroid/widget/TextView;

    .line 32
    iget-object v1, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateText:Landroid/widget/TextView;

    invoke-virtual {v1, p0}, Landroid/widget/TextView;->addTextChangedListener(Landroid/text/TextWatcher;)V

    .line 34
    const v1, 0x7f0e0053

    invoke-virtual {p0, v1}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->findViewById(I)Landroid/view/View;

    move-result-object v1

    check-cast v1, Landroid/widget/Button;

    iput-object v1, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateButton:Landroid/widget/Button;

    .line 35
    iget-object v1, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateButton:Landroid/widget/Button;

    invoke-virtual {v1, p0}, Landroid/widget/Button;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    .line 38
    iget-object v1, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateText:Landroid/widget/TextView;

    invoke-virtual {v1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object v1

    invoke-virtual {p0, v1, v2, v2, v2}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->onTextChanged(Ljava/lang/CharSequence;III)V

    .line 39
    return-void
.end method

.method public onTextChanged(Ljava/lang/CharSequence;III)V
    .registers 7
    .param p1, "s"    # Ljava/lang/CharSequence;
    .param p2, "start"    # I
    .param p3, "before"    # I
    .param p4, "count"    # I

    .prologue
    .line 57
    invoke-static {p1}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->isValidTweet(Ljava/lang/CharSequence;)Z

    move-result v0

    if-eqz v0, :cond_14

    iget-object v0, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateButton:Landroid/widget/Button;

    invoke-virtual {v0}, Landroid/widget/Button;->isEnabled()Z

    move-result v0

    if-nez v0, :cond_14

    .line 58
    iget-object v0, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateButton:Landroid/widget/Button;

    const/4 v1, 0x1

    invoke-virtual {v0, v1}, Landroid/widget/Button;->setEnabled(Z)V

    .line 60
    :cond_14
    invoke-static {p1}, Lcom/chetbox/twitter/android/ComposeTweetActivity;->isValidTweet(Ljava/lang/CharSequence;)Z

    move-result v0

    if-nez v0, :cond_28

    iget-object v0, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateButton:Landroid/widget/Button;

    invoke-virtual {v0}, Landroid/widget/Button;->isEnabled()Z

    move-result v0

    if-eqz v0, :cond_28

    .line 61
    iget-object v0, p0, Lcom/chetbox/twitter/android/ComposeTweetActivity;->mUpdateButton:Landroid/widget/Button;

    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Landroid/widget/Button;->setEnabled(Z)V

    .line 63
    :cond_28
    return-void
.end method
