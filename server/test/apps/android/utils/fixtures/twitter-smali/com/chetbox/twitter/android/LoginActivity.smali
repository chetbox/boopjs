.class public Lcom/chetbox/twitter/android/LoginActivity;
.super Landroid/support/v7/app/AppCompatActivity;
.source "LoginActivity.java"


# instance fields
.field private mLoginButton:Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 15
    invoke-direct {p0}, Landroid/support/v7/app/AppCompatActivity;-><init>()V

    return-void
.end method


# virtual methods
.method protected onActivityResult(IILandroid/content/Intent;)V
    .registers 5
    .param p1, "requestCode"    # I
    .param p2, "resultCode"    # I
    .param p3, "data"    # Landroid/content/Intent;

    .prologue
    .line 49
    invoke-super {p0, p1, p2, p3}, Landroid/support/v7/app/AppCompatActivity;->onActivityResult(IILandroid/content/Intent;)V

    .line 51
    iget-object v0, p0, Lcom/chetbox/twitter/android/LoginActivity;->mLoginButton:Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;

    invoke-virtual {v0, p1, p2, p3}, Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;->onActivityResult(IILandroid/content/Intent;)V

    .line 52
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 4
    .param p1, "savedInstanceState"    # Landroid/os/Bundle;

    .prologue
    .line 21
    invoke-super {p0, p1}, Landroid/support/v7/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V

    .line 22
    const v0, 0x7f04001b

    invoke-virtual {p0, v0}, Lcom/chetbox/twitter/android/LoginActivity;->setContentView(I)V

    .line 24
    const v0, 0x7f0e0056

    invoke-virtual {p0, v0}, Lcom/chetbox/twitter/android/LoginActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;

    iput-object v0, p0, Lcom/chetbox/twitter/android/LoginActivity;->mLoginButton:Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;

    .line 25
    iget-object v0, p0, Lcom/chetbox/twitter/android/LoginActivity;->mLoginButton:Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;

    new-instance v1, Lcom/chetbox/twitter/android/LoginActivity$1;

    invoke-direct {v1, p0}, Lcom/chetbox/twitter/android/LoginActivity$1;-><init>(Lcom/chetbox/twitter/android/LoginActivity;)V

    invoke-virtual {v0, v1}, Lcom/twitter/sdk/android/core/identity/TwitterLoginButton;->setCallback(Lcom/twitter/sdk/android/core/Callback;)V

    .line 45
    return-void
.end method
